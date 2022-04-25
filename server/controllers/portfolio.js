import { Company } from "../models/companies.js";
import { Portfolio } from "../models/portfolio.js";
import { Trade } from "../models/trade.js";

export const getPortfolioValue = async (req, res, next) => {
    res.setHeader("content-type", "application/json");

    let portfolios = await Portfolio.find().select("-transactions -__v");
    if (portfolios.totalDocs == 0)
        return res.status(404).json({
            error: "Could not find any portfolios",
        });
    else {
        return res.status(200).json(portfolios);
    }
};
export const get = async (req, res, next) => {
    res.setHeader("content-type", "application/json");
    let q = req.query;

    let trades = await Trade.find({
        status: "Open",
    });

    if (trades.totalDocs == 0)
        return res.status(404).json({
            error: "Could not find any trades matching the search criteria",
        });
    else {
        let symbolMap = new Map();

        trades.forEach((t) => {
            t.spreads.forEach((s) => {
                s.legs.forEach((leg) => {
                    if (leg.status != "Open") return;

                    if (symbolMap.has(t.underlying)) {
                        let acc = symbolMap.get(t.underlying);
                        acc.cost += leg.executions[0].price * leg.size;
                        acc.commission +=
                            leg.executions[0].commission +
                            leg.executions[0].fees;

                        if (leg.expiration != null) {
                            if (acc.expiration == null)
                                acc.expiration = leg.expiration;
                            else if (
                                new Date(acc.expiration).getTime() >
                                new Date(leg.expiration).getTime()
                            )
                                acc.expiration = leg.expiration;
                        }

                        symbolMap.set(t.underlying, acc);
                    } else {
                        symbolMap.set(t.underlying, {
                            expiration: leg.expiration,
                            underlying: t.underlying,
                            cost: leg.executions[0].price * leg.size,
                            commission:
                                leg.executions[0].commission +
                                leg.executions[0].fees,
                        });
                    }
                });
            });
        });

        let toBeReturned = Array.from(symbolMap.values()).sort((a, b) =>
            a.underlying.localeCompare(b.underlying)
        );

        let underlyingSymbols = [
            ...new Set(toBeReturned.map((e) => e.underlying)),
        ];

        let companyData = await Company.find({
            ticker: { $in: underlyingSymbols },
        }).select("-_id name ticker logo");

        toBeReturned.forEach((item) => {
            const companyInfo = companyData.find(
                (company) => company.ticker == item.underlying
            );
            if (companyInfo) {
                item.name = companyInfo.name;
                item.logo = companyInfo.logo;
            }
        });

        return res.status(200).json(toBeReturned);
    }
};

export const get2 = async (req, res, next) => {
    res.setHeader("content-type", "application/json");
    let q = req.query;

    let trades = await Trade.find({
        status: "Open",
    });

    if (trades.totalDocs == 0)
        return res.status(404).json({
            error: "Could not find any trades matching the search criteria",
        });
    else {
        let symbolMap = new Map();

        trades.forEach((t) => {
            t.spreads.forEach((s) => {
                s.legs.forEach((leg) => {
                    if (leg.status != "Open") return;

                    if (symbolMap.has(leg.symbol)) {
                        let acc = symbolMap.get(leg.symbol);
                        acc.size += leg.size;
                        acc.cost += leg.executions[0].price;
                        acc.price = acc.cost / acc.size;
                        acc.commission +=
                            leg.executions[0].commission +
                            leg.executions[0].fees;

                        symbolMap.set(leg.symbol, acc);
                    } else {
                        symbolMap.set(leg.symbol, {
                            symbol: leg.symbol,
                            strike: leg.strike,
                            expiration: leg.expiration,
                            instrumentType: leg.instrumentType,
                            optionsType: leg.optionsType,
                            underlying: t.underlying,
                            size: leg.size,
                            direction: leg.direction,
                            cost: leg.executions[0].price * leg.size,
                            price: leg.executions[0].price,
                            commission:
                                leg.executions[0].commission +
                                leg.executions[0].fees,
                        });
                    }
                });
            });
        });

        let toBeReturned = Array.from(symbolMap.values()).sort((a, b) =>
            a.symbol.localeCompare(b.symbol)
        );

        let underlyingSymbols = [
            ...new Set(toBeReturned.map((e) => e.underlying)),
        ];

        let companyData = await Company.find({
            ticker: { $in: underlyingSymbols },
        }).select("-_id name ticker logo");

        toBeReturned.forEach((item) => {
            const companyInfo = companyData.find(
                (company) => company.ticker == item.underlying
            );
            if (companyInfo) {
                item.name = companyInfo.name;
                item.logo = companyInfo.logo;
            }
        });

        return res.status(200).json(toBeReturned);
    }
};
export const createPortfolio = async (req, res, next) => {
    console.log(req.body);

    try {
        let newPortfolio = new Portfolio();
        newPortfolio.broker = req.body.broker;
        newPortfolio.name = req.body.name;
        newPortfolio.cash = 0;
        newPortfolio.transactions = [];

        console.log(newPortfolio);

        Portfolio.create(newPortfolio);
        return res
            .status(200)
            .json({ status: "success", _id: newPortfolio._id });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
};

export const getTickers = async (req, res, next) => {
    res.setHeader("content-type", "application/json");
    let q = req.query;

    let trades = await Trade.find();

    if (trades.totalDocs == 0)
        return res.status(404).json({
            error: "Could not find any tickers",
        });
    else {
        let tradeSymbols = [...new Set(trades.map((t) => t.underlying))].sort();

        return res.status(200).json(tradeSymbols);
    }
};
