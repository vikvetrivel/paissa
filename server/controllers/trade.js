import { Trade } from "../models/trade.js";

export const getTrades = (req, res, next) => {
    res.setHeader("content-type", "application/json");

    let q = req.query;
    if (req.query.symbol)
        q.underlying = req.query.symbol.toUpperCase().split(",");

    if (!req.query.page) q.page = 1;
    if (!req.query.limit) q.limit = 100;

    Trade.paginate(q, {
        page: parseInt(q.page),
        limit: parseInt(q.limit),
        underlying: { $in: q.underlying },
        populate: "underlyingDetails spreads.legs.tickerDetails",
        sort: { openDate: -1 },
    }).then((trades) => {
        if (trades.totalDocs == 0)
            return res.status(404).json({
                error: "Could not find any trades matching the search criteria",
            });
        else {
            return res.status(200).json(trades);
        }
    });
};

export const getDetailedTrades = (req, res, next) => {
    let errors = [];
    if (req.query.id) req.query._id = req.query.id;
    else errors.push({ id: "Trade ID required" });
    res.setHeader("content-type", "application/json");

    if (errors.length > 0) return res.status(422).json({ errors: errors });

    Trade.find(req.query)
        .populate("underlyingDetails spreads.legs.tickerDetails")
        .then((trades) => {
            if (trades.length > 0) return res.status(200).json(trades);
            else {
                return res.status(404).json({
                    error: "Could not find any trades with ID " + req.query._id,
                });
            }
        });
};
export const setTrades = () => {};
