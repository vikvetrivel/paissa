import mongoose from "mongoose";
import { executionsSchema } from "./executions.js";
import { Ticker } from "./tickers.js";

const Schema = mongoose.Schema;

export const legSchema = new Schema({
    //userid: { type: Schema.Types.ObjectId, ref: User },
    type: {
        type: String,
        enum: ["Money Movement", "Receive Deliver", "Trade"],
    }, // Trade or Money movement etc.
    direction: {
        type: String,
        enum: ["Short", "Long"],
    },
    optionsType: String,
    symbol: String,
    size: Number,
    expiration: Date,
    strike: Number,
    instrumentType: {
        type: String,
        enum: [
            "Money",
            "Equity",
            "Forex",
            "Equity Option",
            "Future Option",
            "Future",
            "Cryptocurrency",
        ],
    },
    executions: [executionsSchema],
    status: {
        type: String,
        default: "Open",
        enum: ["Open", "Win", "Loss", "BE", "Closed"],
    },

    netReturn: {
        type: Number,
        default: 0.0,
    },

    entryCost: {
        type: Number,
        default: 0.0,
    },

    openDate: Date,
    closeDate: Date,

    tickerDetails: { type: Schema.Types.ObjectId, ref: Ticker },
});

export const Leg = mongoose.model("Leg", legSchema);
