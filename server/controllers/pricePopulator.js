import { Ticker } from "../models/tickers.js";
import axios from "axios";
import axiosThrottle from "axios-request-throttle";
import yahooFinance from "yahoo-finance2";
import { isAfter } from "date-fns";

axiosThrottle.use(axios, { requestsPerSecond: 0.2 });
export const pricePopulator = async () => {
    console.log("Starting Price Populator at " + new Date());
    let finnhub_apiKey = "c41le1iad3ie4kh3ns70";
    let polygon_apikey = "pL6aDMPUUMZfSqYTSd80HD4L1jHFOivS";
    let bulkWriteObj = [];

    let tickersFromDB = await Ticker.find();

    let stockTickers = tickersFromDB.filter((t) => t.ticker.length < 6);
    let optionsTickers = tickersFromDB.filter((t) => t.ticker.length > 6);

    await Promise.all(
        stockTickers.map(async (t) => {
            try {
                let results = await yahooFinance.quote(t.ticker);
                if (results) {
                    bulkWriteObj.push({
                        updateOne: {
                            filter: { _id: t._id },
                            update: {
                                closingPrices: results.regularMarketPrice,
                                lastSyncOn: new Date(),
                            },
                        },
                        upsert: true,
                    });
                }
            } catch (err) {
                console.error(err);
            }
        })
    );

    let yahooFailures = [];
    await Promise.all(
        optionsTickers.map(async (t) => {
            try {
                if (isAfter(new Date(), new Date(t.expiration))) return;
                let results = await yahooFinance.quote(t.ticker);
                if (results) {
                    bulkWriteObj.push({
                        updateOne: {
                            filter: { _id: t._id },
                            update: {
                                closingPrices: results.regularMarketPrice,
                                lastSyncOn: new Date(),
                            },
                        },
                        upsert: true,
                    });
                }
            } catch (err) {
                console.error(err);
                yahooFailures.push(t.ticker);
            }
        })
    );

    console.log(yahooFailures);

    await Promise.all(
        yahooFailures.map(async (t) => {
            try {
                let results = await axios.get(
                    `https://api.polygon.io/v2/aggs/ticker/O:${t}/prev?adjusted=true&apiKey=${polygon_apikey}`
                );

                /*console.log(
                    `https://api.polygon.io/v2/aggs/ticker/O:${t}/prev?adjusted=true&apiKey=${polygon_apikey}`
                );*/

                console.log(results);
                if (results) {
                    bulkWriteObj.push({
                        updateOne: {
                            filter: { _id: t._id },
                            update: {
                                closingPrices: results.data.results[0].c,
                                lastSyncOn: new Date(),
                            },
                        },
                        upsert: true,
                    });
                }
            } catch (err) {
                console.error(err);
            }
        })
    );

    Ticker.bulkWrite(bulkWriteObj, (err) => {
        if (err) console.error("Error saving Ticker Data " + err);
    });
};
