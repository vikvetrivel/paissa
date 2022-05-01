import csvtojson from "csvtojson";

import AdaptorOutput from "./adaptorOutput.js";
import { futuresMultiplier } from "./futuresMultiplier.js";

const tastyworks_adaptor = (req, res) => {
    return new Promise((resolve, reject) => {
        //let sanitizedInputs = new Map();
        let adaptorOutputs = [];
        const csvFilePath = req.file.path;
        console.log("Inside Tastyworks adaptor");

        csvtojson()
            .fromFile(csvFilePath)
            .then((json) => {
                // Prep the data for each lineInCSV. Identify the underlying symbol
                json.forEach((lineInCSV) => {
                    let ao = new AdaptorOutput();

                    ao.executionDate = prepareExecutionDate(lineInCSV.Date);

                    ao.type = prepareType(lineInCSV.Type);

                    [ao.action, ao.direction] = prepareActionAndDirection(
                        lineInCSV.Type,
                        lineInCSV.Action,
                        lineInCSV.Description,
                        lineInCSV["Instrument Type"],
                        lineInCSV.value
                    );

                    ao.symbol = prepareSymbol(lineInCSV.Symbol);

                    ao.instrumentType = prepareInstrumentType(
                        lineInCSV["Instrument Type"]
                    );

                    ao.description = prepareDescription(lineInCSV.Description);

                    ao.value = prepareValue(
                        lineInCSV.Value,
                        lineInCSV["Instrument Type"],
                        lineInCSV.Description,
                        lineInCSV.Quantity,
                        lineInCSV.Type
                    );

                    ao.size = prepareQuantity(lineInCSV.Quantity);

                    ao.price = preparePrice(
                        lineInCSV["Average Price"],
                        lineInCSV["Instrument Type"],
                        lineInCSV.Description,
                        lineInCSV.Quantity,
                        lineInCSV.Type
                    );

                    ao.commission = prepareCommission(lineInCSV.Commissions);
                    ao.fees = prepareFees(lineInCSV.Fees);

                    ao.underlying = prepareUnderlying(
                        lineInCSV["Underlying Symbol"],
                        lineInCSV.Symbol,
                        lineInCSV["Instrument Type"]
                    );

                    ao.expiration = prepareExpirationDate(
                        lineInCSV["Instrument Type"],
                        lineInCSV.Symbol
                    );

                    ao.strike = prepareStrike(lineInCSV["Strike Price"]);

                    ao.optionsType = prepareOptionsType(
                        lineInCSV["Call or Put"]
                    );

                    ao.orderNumber = prepareOrderNumber(lineInCSV["Order #"]);

                    adaptorOutputs.push(ao);
                });

                //console.table(adaptorOutputs);
                resolve(adaptorOutputs);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const prepareExecutionDate = (_date) => new Date(_date);

const prepareType = (_type) => {
    switch (_type) {
        case "Money Movement":
        case "Trade":
        case "Receive Deliver":
            return _type;
        default:
            return "TRADE";
    }
};

const prepareActionAndDirection = (
    _type,
    _action,
    _desc,
    _instrumentType,
    _value
) => {
    switch (_action) {
        case "BUY_TO_OPEN":
            return ["Buy", "OpeningTrade"];
        case "BUY_TO_CLOSE":
            return ["Buy", "ClosingTrade"];
        case "SELL_TO_OPEN":
            return ["Sell", "OpeningTrade"];
        case "SELL_TO_CLOSE":
            return ["Sell", "ClosingTrade"];
        case "BUY":
            return ["Buy", "FuturesTrade"];
        case "SELL":
            return ["Sell", "FuturesTrade"];

        default:
            //It is blank
            switch (_type) {
                case "Money Movement":
                    switch (_instrumentType) {
                        case "Future":
                            return ["Misc Money Movements", "None"];

                        case "Equity":
                            if (_value < 0) return ["Tax Withheld", "None"];
                            else return ["Dividend", "None"];

                        default:
                            if (
                                _desc
                                    .toLowerCase()
                                    .includes("regulatory fee adjustment")
                            )
                                return ["Regulatory Adjustment", "None"];
                            if (
                                _desc
                                    .toLowerCase()
                                    .includes("wire funds received") ||
                                _desc.toLowerCase().includes("tfr")
                            )
                                return ["Deposit", "None"];
                            if (
                                _desc
                                    .toLowerCase()
                                    .includes("interest on credit balance") ||
                                _desc.toLowerCase().includes("thru")
                            )
                                return ["Interest", "None"];
                    }

                case "Receive Deliver":
                    if (_desc.toLowerCase().includes("expiration"))
                        return ["Expiry", "ClosingTrade"];
                    if (_desc.toLowerCase().includes("assignment"))
                        return ["Assignment", "ClosingTrade"];
                    if (_desc.toLowerCase().includes("exercise"))
                        return ["Exercise", "ClosingTrade"];
                default:
                    console.error(
                        "Inside prepareActionAndDirection - This shouldn't happen " +
                            _desc
                    );
                    return ["None", "None"];
            }
    }
};

const prepareSymbol = (_symbol) => _symbol.replaceAll(" ", "");

const prepareInstrumentType = (_it) => {
    switch (_it) {
        case "Cryptocurrency":
        case "Equity":
        case "Forex":
        case "Equity Option":
        case "Future Option":
        case "Future":
            return _it;
        default:
            return "Money";
    }
};

const prepareDescription = (_desc) => _desc;

const prepareValue = (_value, _it, _desc, _q, _type) => {
    if (_it == "Future" && _type == "Trade") {
        // Find the future transaction value from the description field
        const _split = _desc.split(" ");
        const _v = _split[4] * _q;
        const _direction = _split[0];
        const _f = _split[2];
        const _u = _f.substring(1, _f.length - 2);

        let multiplier = 1;
        if (futuresMultiplier[_u]) multiplier = futuresMultiplier[_u];

        // console.log(
        //     "prepareValue: " +
        //         _u +
        //         " " +
        //         futuresMultiplier[_u] +
        //         " " +
        //         multiplier
        // );
        // If the future is bought, money is debited. Hence the value needs to negative.
        if (_direction == "Sold") return _v * multiplier;
        return -1 * _v * multiplier;
    }
    return parseFloat(_value.replace(/,/g, ""));
};

const prepareQuantity = (q) => q;

const preparePrice = (_price, _it, _desc, _q, _type) => {
    if (_q == 0) return 0;

    if (_it == "Future" && _type == "Trade") {
        // Find the future transaction value from the description field
        const _split = _desc.split(" ");
        const _v = _split[4];
        const _direction = _split[0];
        const _f = _split[2];
        const _u = _f.substring(1, _f.length - 2);

        let multiplier = 1;
        if (futuresMultiplier[_u]) multiplier = futuresMultiplier[_u];
        // console.log(
        //     "preparePrice: " +
        //         _u +
        //         " " +
        //         futuresMultiplier[_u] +
        //         " " +
        //         multiplier
        // );

        // If the future is bought, money is debited. Hence the value needs to negative.
        if (_direction == "Sold") return _v * multiplier;
        return -1 * _v * multiplier;
    }
    return parseFloat(_price.replace(/,/g, ""));
};

const prepareCommission = (c) => {
    if (c === "--") return 0;
    else return c;
};

const prepareFees = (f) => f;

const prepareUnderlying = (_us, _s, _it) => {
    switch (_it) {
        case "Future":
            return _s.substring(1, _s.length - 2);
        case "Equity":
        case "Cryptocurrency":
            return _s;
        case "Future Option":
            return _us.substring(1, _us.length - 2);
        default:
            return _us;
    }
};

const prepareExpirationDate = (_it, _s) => {
    if (_it.toLowerCase().includes("option")) {
        return new Date(
            `20${_s.substring(_s.length - 15, _s.length - 13)}-${_s.substring(
                _s.length - 13,
                _s.length - 11
            )}-${_s.substring(_s.length - 11, _s.length - 9)}`
        );
    }
    return "";
};

const prepareStrike = (_s) => _s;

const prepareOptionsType = (_ot) => _ot;

const prepareOrderNumber = (o) => o;

export default tastyworks_adaptor;
