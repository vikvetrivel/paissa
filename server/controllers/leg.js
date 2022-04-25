import tastyworks_adaptor from "../adaptors/tastyworks.js";
import { Execution } from "../models/executions.js";
import { Spread } from "../models/spread.js";
import { Company } from "../models/companies.js";
import axios from "axios";
import { Portfolio } from "../models/portfolio.js";
import { isSameDay, min, isEqual } from "date-fns";
import { Ticker } from "../models/tickers.js";
import { Trade } from "../models/trade.js";
import { Leg } from "../models/leg.js";

const spreadTypes = {
    "-1C": "Naked Short Call",
    "+1C": "Long Call",
    "-1P": "Naked Short Put",
    "+1P": "Long Put",
    "+1P/-1P": "Bull Put Spread",
    "-1C/+1C": "Bear Call Spread",
    "+1P/-1C^-1P/+1C": "Iron Butterfly",
    "+1P/-1P^-1C/+1C": "Iron Butterfly",
    "-P/+1C^+1P/-1C": "Inverse Iron Butterfly",
    "-1P/+1P^+1C/-1C": "Inverse Iron Butterfly",
    "+1P/-1P/-1C/+1C": "Iron Condor",
    "-1P/+1P/+1C/-1C": "Inverse Iron Condor",
    "+1P/-2P/+1P": "Long Put Butterfly",
    "+1P/+2P/-1P": "Short Put Butterfly",
    "+1C/-2C/+1C": "Long Call Butterfly",
    "-1C/+2C/-1C": "Short Call Butterfly",
    "-1C*+1C": "Calendar Call Spread",
    "-1P*+1P": "Calendar Put Spread",
    "*+1C/-1C": "PMCC",
    "-1P/*+1P": "Diagonal Put Spread",
    "-1P^-1C": "Short Straddle",
    "-1C^-1P": "Short Straddle",
    "+1P^+1C": "Long Straddle",
    "+1C^+1P": "Long Straddle",
    "-1P/-1C": "Short Strangle",
    "+1P/+1C": "Long Strangle",
    "-1P/-1C/+1C": "Jade Lizard",
    "-1C/+1C": "Bull Call Spread",
    "-1P/+1P": "Bull Put Spread",
    "-1C/+2C": "Call Ratio Backspread",
    "+1P/-2P/+1P": "Put Broken Wing",
    "-1C/+2C/-1C": "Inverse Call Broken Wing",
    "+2P/-1P": "Put Ration Backspread",
    "+1C/-2C/+1C": "Call Broken Wing",
    "-1P/+2P/-1P": "Inverse Put Broken Wing",
    "+1C/-1C/-1C": "Bull Call Ladder",
    "-1C/+1C/+1C": "Bear Call Ladder",
    "+1P/+1P/-1P": "Bull Put Ladder",
    "-1P/-1P/+1P": "Bear Put Ladder",
    "+1P/-1P/-1C": "Reverse Jade Lizard",
    "+1C/-2C": "Call Ratio Spread",
    "-2P/+1P": "Put Ratio Spread",
    "-1P^+1C": "Long Synthetic Future",
    "+1C^-1P": "Long Synthetic Future",
    "+1P^-1C": "Short Synthetic Future",
    "+1P^-1C": "Short Synthetic Future",
    "-1P/+1C": "Long Combo",
    "+1P/-1C": "Short Combo",
    "+1C^+2P": "Strip",
    "+2P^+1C": "Strip",
    "+2C^+1P": "Strap",
    "+1P^+2C": "Strap",
    "+1C/+1P": "Guts",
    "-1C/-1P": "Short Guts",
    "*+1P/-1P/-1C/*+1C": "Double Diagonal",
};
export const getLegs = (req, res, next) => {
    let errors = [];
    if (req.query.id) req.query._id = req.query.id;
    else errors.push({ id: "Trade ID required" });
    res.setHeader("content-type", "application/json");

    if (errors.length > 0) return res.status(422).json({ errors: errors });

    Trade.find(req.query)
        .select("legs")
        .then((trades) => {
            if (trades.length > 0) return res.status(200).json(trades);
            else {
                return res.status(404).json({
                    error: "Could not find any trades with ID " + req.query._id,
                });
            }
        });
};
export const importExecutionsFromFile = async (req, res, next) => {
    let adaptorOutputs = [];

    try {
        let portfolio = await Portfolio.findById(req.body.pid);

        let broker = portfolio.broker;
        switch (broker) {
            case "TastyWorks":
            case "TastyWorks Cash":
            case "TastyWorks The Works":
            case "TastyWorks Margin":
                adaptorOutputs = await tastyworks_adaptor(req, res);
                break;

            default:
                res.status(500).send("Unsupported Broker");
                return;
        }
        // Let's sort the adaptorOutputs in the following order, as the closing and opening of trades depends on order.
        //   a) Ascending order of time
        //   b) If time is same, then Closing Trades before Opening Trades
        //   c) If A and B are the same, then ascending order of OrderNumber

        adaptorOutputs.sort((a, b) => {
            if (a.executionDate < b.executionDate) return -1;
            else if (a.executionDate > b.executionDate) return 1;
            else if (a.direction == b.direction)
                return a.orderNumber - b.orderNumber;
            else if (a.direction == "OpeningTrade") return 1;
            else return -1;
        });

        let tickerMap = await populateTickers(adaptorOutputs);

        let [uniqueUnderlyingsFound, companyMap] = await populateCompanies(
            adaptorOutputs
        );

        let openTradesMap = new Map();

        let tradesFromDB = await Trade.find({
            underlying: { $in: uniqueUnderlyingsFound },
            status: "OPEN",
            portfolio: portfolio._id,
        });

        tradesFromDB.forEach((a) =>
            openTradesMap.has(a.underlying)
                ? openTradesMap.get(a.underlying).push(a)
                : openTradesMap.set(a.underlying, [a])
        );

        let prevDate = adaptorOutputs[0].executionDate;

        adaptorOutputs.forEach((ao) => {
            if (!isSameDay(prevDate, ao.executionDate)) {
                //New calendar day. Let's close the existing trades.
                let openTrades = Array.from(openTradesMap.values());
                openTrades.forEach((trade) => updateTradeMetadata(trade));
            }

            ao.tickerId = tickerMap.get(ao.symbol);

            prevDate = ao.executionDate;

            let foundMatchForAdaptorOutput = false;

            if (ao.type == "Money Movement") {
                if (ao.instrumentType != "Future") {
                    portfolio.transactions.push({
                        date: ao.executionDate,
                        type: ao.type,
                        description: ao.description,
                        value: ao.value,
                        action: ao.action,
                        ticker: ao.underlying,
                    });

                    portfolio.cash += new Number(ao.value);
                }

                return;
            }

            portfolio.cash +=
                new Number(ao.value) +
                new Number(ao.commission) +
                new Number(ao.fees);

            if (
                ao.direction === "ClosingTrade" ||
                ao.direction === "Expiry" ||
                ao.direction === "Assignment"
            )
                foundMatchForAdaptorOutput = handleClosingExecution(
                    ao,
                    openTradesMap
                );
            else if (ao.direction === "OpeningTrade")
                foundMatchForAdaptorOutput = handleOpeningExecution(
                    ao,
                    openTradesMap
                );
            else if (ao.direction === "FuturesTrade")
                foundMatchForAdaptorOutput = handleFuturesExecution(
                    ao,
                    openTradesMap
                );

            if (!foundMatchForAdaptorOutput) {
                let t = createTradeFromAdaptorObject(ao, portfolio, companyMap);

                if (openTradesMap.has(t.underlying))
                    openTradesMap.get(t.underlying).push(t);
                else openTradesMap.set(t.underlying, [t]);
            }
        });

        let openTrades = Array.from(openTradesMap.values());

        openTrades.forEach((trade) => updateTradeMetadata(trade));
        await portfolio.save();

        //Write the modified/new data to the database
        Trade.bulkWrite(prepareBulkWrite(openTrades), (err) => {
            if (err)
                res.status(500).send({
                    error: "Error saving the data " + err,
                });
            else {
                res.status(200).send({
                    success: "Data written successfully",
                });
            }
        });
    } catch (err) {
        res.status(500).send("Error:  " + err);
    }
};

const handleFuturesExecution = (ao, otm) => {
    let underlyingTrades = otm.get(ao.underlying);

    if (!underlyingTrades) return false;

    for (let t = 0; t < underlyingTrades.length; t++) {
        if (underlyingTrades[t].status != "Open") continue;

        let spreads = underlyingTrades[t].spreads;

        // There should only be one active spread. If not, something's wrong.

        for (let s = 0; s < spreads.length; s++) {
            let legs = spreads[s].legs.filter((l) => {
                if (l.status != "Open" || l.symbol != ao.symbol) return false;
                else return true;
            });

            for (let l = 0; l < legs.length; l++) {
                if (
                    (ao.action == "Buy" && legs[l].direction == "Short") ||
                    (ao.action == "Sell" && legs[l].direction == "Long")
                ) {
                    if (ao.size == legs[l].size) {
                        ao.direction = "ClosingTrade";
                        addExecutionToLeg(legs[l], ao);
                        if (!underlyingTrades[t].status)
                            underlyingTrades[t].status = "Modified";
                        legs[l].status = "Closed";
                        return true;
                    }

                    if (ao.size < legs[l].size) {
                        ao.direction = "ClosingTrade";
                        let copyOfLeg = cloneLeg(legs[l]);
                        copyOfLeg.size = ao.size;
                        legs[l].size -= ao.size;
                        addExecutionToLeg(copyOfLeg, ao);
                        copyOfLeg.status = "Closed";
                        addLegToSpread(spreads[s], copyOfLeg);
                        if (!underlyingTrades[t].editStatus)
                            underlyingTrades[t].editStatus = "Modified";
                        return true;
                    }

                    if (ao.size > legs[l].size) {
                        ao.direction = "ClosingTrade";
                        let copyOfAO = structuredClone(ao);
                        copyOfAO.size = legs[l].size;
                        ao.size -= legs[l].size;
                        addExecutionToLeg(legs[l], copyOfAO);
                        if (!underlyingTrades[t].status)
                            underlyingTrades[t].status = "Modified";
                        legs[l].status = "Closed";
                    }
                }
            }

            let newLeg = createLegFromExecution(ao);
            addLegToSpread(spreads[s], newLeg);
            return true;
        }
    }
    return false;
};

const handleClosingExecution = (ao, otm) => {
    let underlyingTrades = otm.get(ao.underlying);

    if (!underlyingTrades) return false;

    for (let t = 0; t < underlyingTrades.length; t++) {
        if (underlyingTrades[t].status != "Open") continue;
        let spreads = underlyingTrades[t].spreads.filter(
            (s) => s.status == "Open"
        );

        for (let s = 0; s < spreads.length; s++) {
            let legs = spreads[s].legs.filter((l) => {
                if (l.status != "Open" || l.symbol != ao.symbol) return false;
                else return true;
            });

            for (let l = 0; l < legs.length; l++) {
                let execs = legs[l].executions.filter(
                    (e) => e.direction === "OpeningTrade"
                );

                if (execs) {
                    if (ao.size == legs[l].size) {
                        addExecutionToLeg(legs[l], ao);
                        if (!underlyingTrades[t].status)
                            underlyingTrades[t].status = "Modified";
                        legs[l].status = "Closed";
                        return true;
                    }

                    if (ao.size < legs[l].size) {
                        let copyOfLeg = cloneLeg(legs[l]);
                        copyOfLeg.size = ao.size;
                        legs[l].size -= ao.size;
                        addExecutionToLeg(copyOfLeg, ao);
                        copyOfLeg.status = "Closed";
                        addLegToSpread(spreads[s], copyOfLeg);
                        if (!underlyingTrades[t].editStatus)
                            underlyingTrades[t].editStatus = "Modified";
                        return true;
                    }

                    if (ao.size > legs[l].size) {
                        let copyOfAO = structuredClone(ao);
                        copyOfAO.size = legs[l].size;
                        ao.size -= legs[l].size;
                        addExecutionToLeg(legs[l], copyOfAO);
                        if (!underlyingTrades[t].status)
                            underlyingTrades[t].status = "Modified";
                        legs[l].status = "Closed";
                    }
                }
            }
        }
    }

    return false;
};

const handleOpeningExecution = (ao, otm) => {
    let underlyingTrades = otm.get(ao.underlying);

    if (!underlyingTrades) return false;

    for (let t = 0; t < underlyingTrades.length; t++) {
        if (underlyingTrades[t].status != "Open") continue;

        let spreads = underlyingTrades[t].spreads;

        for (let s = 0; s < spreads.length; s++) {
            let legs = spreads[s].legs;
            /*let legs = spreads[s].legs.filter((l) => {
                if (l.status == "Open") return true;
                else return false;
            });*/

            for (let l = 0; l < legs.length; l++) {
                // console.log("before filter 3");
                let execs = legs[l].executions.filter(
                    (e) => e.orderNumber == ao.orderNumber
                );

                if (execs.length > 0) {
                    let newLeg = createLegFromExecution(ao);
                    if (execs[0].direction == "OpeningTrade")
                        addLegToSpread(spreads[s], newLeg);
                    else {
                        let newSpread = createSpreadFromLeg(newLeg);
                        newSpread.howOpened = "Rolled In";
                        newSpread.howClosed = "Still Open";
                        newSpread.prevSpread = spreads[s]._id;
                        spreads[s].howClosed = "Rolled Out";
                        spreads[s].nextSpread = newSpread._id;
                        addSpreadToTrade(underlyingTrades[t], newSpread);
                    }
                    if (!underlyingTrades[t].editStatus)
                        underlyingTrades[t].editStatus = "Modified";
                    return true;
                }
            }
        }

        //Couldn't find a matching spread for this execution, but let's add it to this open trade.
        let newSpread = createSpreadFromLeg(createLegFromExecution(ao));
        newSpread.howOpened = "New";
        newSpread.howClosed = "Still Open";
        addSpreadToTrade(underlyingTrades[t], newSpread);
        if (!underlyingTrades[t].editStatus)
            underlyingTrades[t].editStatus = "Modified";
        return true;
    }
    return false;
};

//EXECUTIONS -> LEGS

const createLegFromExecution = (execution) => {
    let leg = new Leg();

    leg.type = execution.type;
    leg.optionsType = execution.optionsType;
    leg.symbol = execution.symbol;
    leg.expiration = execution.expiration;
    leg.strike = execution.strike;
    leg.instrumentType = execution.instrumentType;
    leg.size = execution.size;
    leg.status = "Open";
    leg.tickerDetails = execution.tickerId;
    if (execution.direction == "FuturesTrade")
        execution.direction = "OpeningTrade";

    if (execution.direction === "OpeningTrade") {
        if (execution.action === "Buy") leg.direction = "Long";
        else leg.direction = "Short";
    } else {
        if (execution.action === "Sell") leg.direction = "Long";
        else leg.direction = "Short";
    }

    addExecutionToLeg(leg, execution);

    return leg;
};

const addExecutionToLeg = (leg, execution) => {
    // The execution could either be a line from the csv, or actually an execution object.
    // Check for the type first

    if (execution instanceof Execution) leg.executions.push(execution);
    else leg.executions.push(createExecutionFromData(execution));
};

const cloneLeg = (leg) => {
    //Deep clone's the leg. The lodash functions are causing an error in mongoose

    let clone = new Leg();

    clone.type = leg.type;
    clone.direction = leg.direction;
    clone.optionsType = leg.optionsType;
    clone.symbol = leg.symbol;
    clone.size = leg.size;
    clone.expiration = leg.expiration;
    clone.strike = leg.strike;
    clone.instrumentType = leg.instrumentType;
    clone.status = leg.status;
    clone.netReturn = leg.netReturn;
    clone.entryCost = leg.entryCost;
    clone.openDate = leg.openDate;
    clone.closeDate = leg.closeDate;
    clone.tickerDetails = leg.tickerDetails;

    leg.executions.forEach((execution) => {
        let cloneExecution = new Execution();
        cloneExecution.action = execution.action;
        cloneExecution.direction = execution.direction;
        cloneExecution.importDate = execution.importDate;
        cloneExecution.executionDate = execution.executionDate;
        cloneExecution.price = execution.price;
        cloneExecution.commission = 0; //The commission and fees shouldn't be double counted
        cloneExecution.fees = 0;
        cloneExecution.orderNumber = execution.orderNumber;
        cloneExecution.description = execution.description;
        clone.executions.push(cloneExecution);
    });

    return clone;
};

const createExecutionFromData = (data) => {
    let _execution = new Execution();
    _execution.action = data.action;
    _execution.direction = data.direction;
    _execution.importDate = data.importDate;
    _execution.executionDate = data.executionDate;
    _execution.price = data.price;
    _execution.commission = data.commission;
    _execution.fees = data.fees;
    _execution.orderNumber = data.orderNumber;
    _execution.description = data.description;
    return _execution;
};

// LEG -> SPREAD
const createSpreadFromLeg = (leg) => {
    let spread = new Spread();
    spread.legs.push(leg);
    spread.status = "Open";
    return spread;
};

const addLegToSpread = (spread, leg) => {
    spread.legs.push(leg);
    spread.status = "Open";
};

//SPREAD -> TRADE
const createTradeFromSpread = (spread, underlying, portfolio, companyMap) => {
    let trade = new Trade();
    trade.portfolio = portfolio._id;
    trade.editStatus = "New";
    trade.underlying = underlying;
    trade.underlyingDetails = companyMap.get(trade.underlying);

    addSpreadToTrade(trade, spread);

    return trade;
};

const addSpreadToTrade = (trade, spread) => {
    trade.spreads.push(spread);
    if (!trade.editStatus) trade.editStatus = "Modified";
};

// EXECUTION -> TRADE
const createTradeFromAdaptorObject = (execution, portfolio, companyMap) => {
    let leg = createLegFromExecution(execution);
    let spread = createSpreadFromLeg(leg);
    return createTradeFromSpread(
        spread,
        execution.underlying,
        portfolio,
        companyMap
    );
};

// UPDATE METADATA

const updateLegMetadata = (leg) => {
    leg.entryCost = 0;
    leg.exitCost = 0;

    const totalFeeesAndCommissions = leg.executions.reduce(
        (acc, c) => acc + c.commission + c.fees,
        0
    );
    const openingExecution = leg.executions.find(
        (execution) => execution.direction == "OpeningTrade"
    );

    const closingExecution = leg.executions.find(
        (execution) => execution.direction == "ClosingTrade"
    );

    try {
        if (openingExecution) {
            leg.openDate = openingExecution.executionDate;
            leg.entryCost =
                openingExecution.price * leg.size +
                openingExecution.commission +
                openingExecution.fees;
        }

        if (closingExecution) {
            leg.closeDate = closingExecution.executionDate;
            if (leg.netReturn > 0) leg.status = "Win";
            else if (leg.netReturn < 0) leg.status = "Loss";
            else leg.status = "BE";
            leg.exitCost =
                closingExecution.price * leg.size +
                closingExecution.commission +
                closingExecution.fees;
        }
    } catch (err) {
        console.log(`${err} for ${leg}`);
    }

    leg.netReturn = leg.exitCost + leg.entryCost;
};

const updateSpreadMetadata = (spread) => {
    computeSpreadType(spread);

    // If all the legs are closed, then the spread is closed.
    spread.legs.forEach((leg) => updateLegMetadata(leg));
    if (spread.legs.map((l) => l.status).indexOf("Open") == -1) {
        spread.status = "Closed";
        if (spread.howClosed == "Still Open") spread.howClosed = "Closed";
    }

    spread.netReturn = spread.legs.reduce((a, leg) => {
        return a + leg.netReturn;
    }, 0);

    spread.entryCost = spread.legs.reduce(
        (prev, curr) => prev + curr.entryCost,
        0
    );

    spread.earliestExpiration = spread.legs.reduce((prev, curr) => {
        return prev < curr.expiration ? prev : curr.expiration;
    }, new Date("01/01/3000"));

    spread.openDate = spread.legs.reduce((prev, curr) => {
        return prev < curr.openDate ? prev : curr.openDate;
    }, new Date("01/01/3000"));

    spread.closeDate = spread.legs.reduce((prev, curr) => {
        return prev > curr.closeDate ? prev : curr.closeDate;
    }, new Date("01/01/1900"));

    spread.strikes = [...new Set(spread.legs.map((leg) => leg.strike))];
    spread.instrumentTypes = [
        ...new Set(spread.legs.map((leg) => leg.instrumentType)),
    ];

    spread.legCount = spread.legs.length;
};

const updateTradeMetadata = (t) => {
    t.forEach((trade) => {
        if (trade.status != "Open") return;
        trade.spreads.forEach((spread) => updateSpreadMetadata(spread));
        let openingSpread = trade.spreads.filter((spread) => {
            return isEqual(
                spread.openDate,
                min(trade.spreads.map((s) => s.openDate))
            );
        });

        trade.netReturn = trade.spreads.reduce((a, item) => {
            return a + item.netReturn;
        }, 0);

        try {
            trade.openDate = openingSpread[0]?.openDate;
            trade.openingSpreadType = openingSpread[0]?.spreadType;
        } catch (err) {
            console.log(err);
            console.log(trade);
        }

        trade.entryCost = trade.spreads
            .filter((s) => s.howOpened == "New")
            .map((s) => s.entryCost)
            .reduce((p, c) => p + c, 0);

        if (trade.spreads.map((s) => s.status).indexOf("Open") == -1) {
            trade.status = "Closed";

            if (trade.netReturn > 0) trade.status = "Win";
            else if (trade.netReturn < 0) trade.status = "Loss";
            else if (trade.netReturn == 0) trade.status = "BE";

            trade.closeDate = trade.spreads.reduce((prev, curr) => {
                return prev > curr.closeDate ? prev : curr.closeDate;
            }, new Date("01/01/1900"));
        } else trade.status = "Open";

        trade.earliestExpiration = trade.spreads.reduce((prev, curr) => {
            if (curr.earliestExpiration)
                return prev < curr.earliestExpiration
                    ? prev
                    : curr.earliestExpiration;
            return prev;
        }, new Date("01/01/3000"));

        if (isSameDay(trade.earliestExpiration, new Date("01/01/3000")))
            trade.earliestExpiration = null;

        trade.strikes = [
            ...new Set(trade.spreads.map((spread) => spread.strikes).flat()),
        ];
        trade.instrumentTypes = [
            ...new Set(
                trade.spreads.map((spread) => spread.instrumentTypes).flat()
            ),
        ];

        trade.side = trade.entryCost > 0 ? "Short" : "Long"; //FIXME: This should be the opening spread's side
        trade.spreadCount = trade.spreads.length;
        trade.target = 0; // FIXME:
    });
};

//COMPUTE SPREAD TYPES
const computeSpreadType = (spread) => {
    if (
        spread.legs[0].instrumentType != "Equity Option" &&
        spread.legs[0].instrumentType != "Future Option"
    ) {
        let t = spread.legs
            .map((l) => l.size)
            .reduce((acc, curr) => acc + curr, 0);
        if (t < 0) spread.spreadType = `Short ${spread.legs[0].instrumentType}`;
        else spread.spreadType = `Long ${spread.legs[0].instrumentType}`;
        return;
    }
    let spreadPatternFromLegs = "";

    // Arrange the legs within the spread in ascending order of strike.
    // Find the GCD of all the quantities to normalize the numbers.
    // Find the lowest date from all the legs so that the * can be added when the date is higher.

    //Let's normalize the spread.
    let assetCount = new Map();

    spread.legs.forEach((l) => {
        if (assetCount.has(l.symbol)) {
            let x = assetCount.get(l.symbol);
            x.acc += l.size;
            //assetCount.set(l.symbol, x);
        } else {
            l.acc = l.size;
            assetCount.set(l.symbol, l);
        }
    });

    let normalizedSpread = Array.from(assetCount.values());

    let gcd = gcdOfArray(normalizedSpread.map((l) => Math.abs(l.acc)));
    let minDate = new Date(
        Math.min(...spread.legs.map((leg) => leg.expiration))
    );

    //This is to ensure that the spreadPattern is written on ascending strikes
    normalizedSpread.sort((a, b) => a.strike - b.strike);

    //Prepare the Pattern String
    let tempStrike = normalizedSpread[0].strike;

    normalizedSpread.forEach((leg, index) => {
        let strikeSymbol = "";
        if (index != 0) strikeSymbol = leg.strike == tempStrike ? "^" : "/";
        let dateSymbol = leg.expiration > minDate ? "*" : "";
        let _size = leg.acc / gcd;
        let symbol = leg.direction == "Short" ? "-" : "+";
        let letter = leg.optionsType == "CALL" ? "C" : "P";

        tempStrike = leg.strike;
        spreadPatternFromLegs += `${strikeSymbol}${dateSymbol}${symbol}${_size}${letter}`;
    });

    if (spreadTypes[spreadPatternFromLegs])
        spread.spreadType = spreadTypes[spreadPatternFromLegs];
    else spread.spreadType = `Custom ${spread.legs.length} Leg Spread`;
};

const prepareBulkWrite = (tl) => {
    let bulkWriteObj = [];

    tl.forEach((tradeList) => {
        tradeList.forEach((trade) => {
            if (!trade.editStatus) return;

            if (
                trade.editStatus.localeCompare("New") == 0 &&
                trade.spreads.length > 0
            ) {
                //Create a new trade.
                bulkWriteObj.push({
                    insertOne: {
                        document: trade,
                    },
                });
            } else if (trade.editStatus.localeCompare("New") != 0) {
                bulkWriteObj.push({
                    updateOne: {
                        filter: { _id: trade._id },
                        update: {
                            $set: {
                                spreads: trade.spreads,
                                status: trade.status,
                                netReturn: trade.netReturn,
                                instrumentTypes: trade.instrumentTypes,
                                strikes: trade.strikes,
                                spreads: trade.spreads,
                                closeDate: trade.closeDate,
                            },
                        },
                        upsert: true,
                    },
                });
            }
        });
    });

    return bulkWriteObj;
};

const createCompanies = async (tickers) => {
    let finnhub_apiKey = "c41le1iad3ie4kh3ns70";
    let finnhub_company2_baseurl = `https://finnhub.io/api/v1/stock/profile2?token=${finnhub_apiKey}&symbol=`;

    let bulkWriteObj = [];

    let companyMap = new Map();

    for (const ticker of tickers) {
        try {
            let response = await axios.get(finnhub_company2_baseurl + ticker);

            let company = new Company();

            company.country = response.data.country;
            company.currency = response.data.currency;
            company.exchange = response.data.exchange;
            company.ipo = new Date(response.data.ipo);
            company.marketCapitalization = response.data.marketCapitalization;
            company.name = response.data.name;
            company.phone = response.data.phone;
            company.sharesOutstanding = response.data.sharesOutstanding;
            company.weburl = response.data.weburl;
            company.logo = response.data.logo;
            company.finnhubIndustry = response.data.finnhubIndustry;
            company.ticker = ticker;

            companyMap.set(ticker, company._id);

            bulkWriteObj.push({
                insertOne: {
                    document: company,
                },
            });
        } catch (err) {
            console.log(err);
        }
    }

    Company.bulkWrite(bulkWriteObj, (err) => {
        if (err) console.error("Error saving Company Data " + err);
    });

    return companyMap;
};

const createTickers = async (tickers) => {
    let finnhub_apiKey = "c41le1iad3ie4kh3ns70";
    let polygon_apikey = "pL6aDMPUUMZfSqYTSd80HD4L1jHFOivS";
    let bulkWriteObj = [];
    let tickerMap = new Map();

    for (const ticker of tickers) {
        try {
            //let response = await axios.get(finnhub_company2_baseurl + ticker);
            let newTicker = new Ticker();
            newTicker.currency = "USD";
            newTicker.ticker = ticker;
            newTicker.closingPrices = 0;
            newTicker.lastSyncOn = new Date();

            newTicker.expiration = new Date(
                `20${ticker.substring(
                    ticker.length - 15,
                    ticker.length - 13
                )}-${ticker.substring(
                    ticker.length - 13,
                    ticker.length - 11
                )}-${ticker.substring(ticker.length - 11, ticker.length - 9)}`
            );

            tickerMap.set(ticker, newTicker._id);
            bulkWriteObj.push({
                insertOne: {
                    document: newTicker,
                },
            });
        } catch (err) {
            console.log(err);
        }
    }

    Ticker.bulkWrite(bulkWriteObj, (err) => {
        if (err) console.error("Error saving Company Data " + err);
    });

    return tickerMap;
};

async function populateCompanies(adaptorOutputs) {
    let uniqueUnderlyingsFound = [
        ...new Set(adaptorOutputs.map((ao) => ao.underlying)),
    ];

    // Do we have all the required companies in our database?
    let existingSymbolsInDB = await Company.find({
        ticker: { $in: uniqueUnderlyingsFound },
    }).select("ticker _id");

    existingSymbolsInDB = [
        ...new Set(existingSymbolsInDB.map((x) => x.ticker)),
    ];

    let newCompaniesToCreate = uniqueUnderlyingsFound.filter(
        (x) => !existingSymbolsInDB.includes(x)
    );

    let companyMap = await createCompanies(newCompaniesToCreate);

    existingSymbolsInDB.forEach((s) => {
        companyMap.set(s.ticker, s._id);
    });
    return [uniqueUnderlyingsFound, companyMap];
}

async function populateTickers(adaptorOutputs) {
    let uniqueTickersFound = [
        ...new Set(adaptorOutputs.map((ao) => ao.symbol)),
    ];

    // Do we have all the required tickers in our database?
    let existingTickersinDB = await Ticker.find({
        ticker: { $in: uniqueTickersFound },
    }).select("ticker _id");

    existingTickersinDB = [
        ...new Set(existingTickersinDB.map((x) => x.ticker)),
    ];

    let newTickersToCreate = uniqueTickersFound.filter(
        (x) => !existingTickersinDB.includes(x) && x != ""
    );

    let tickerMap = await createTickers(newTickersToCreate);

    existingTickersinDB.forEach((s) => {
        companyMap.set(s.ticker, s._id);
    });
    return tickerMap;
}

//UTILITY FUNCTIONS
function gcdOfArray(input) {
    if (toString.call(input) !== "[object Array]") return false;
    var len, a, b;
    len = input.length;
    if (!len) {
        return null;
    }
    a = input[0];
    for (var i = 1; i < len; i++) {
        b = input[i];
        a = gcd_two_numbers(a, b);
    }
    return a;
}

function gcd_two_numbers(x, y) {
    if (typeof x !== "number" || typeof y !== "number") return false;
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}
