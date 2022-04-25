import mongoose from "mongoose";

const Schema = mongoose.Schema;

let tickersSchema = new Schema({
    currency: String,
    ticker: String,
    closingPrices: Number,
    type: String,
    lastSyncOn: Date,
    expiration: Date,
});

export const Ticker = mongoose.model("Tickers", tickersSchema);
