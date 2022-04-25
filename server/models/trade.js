import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { Company } from "./companies.js";
import { Portfolio } from "./portfolio.js";
import { spreadSchema } from "./spread.js";

const Schema = mongoose.Schema;

let tradeSchema = new Schema({
    portfolio: { type: Schema.Types.ObjectId, ref: Portfolio },
    earliestExpiration: Date,
    underlying: String,
    underlyingDetails: { type: Schema.Types.ObjectId, ref: Company },
    status: {
        type: String,
        default: "Open",
        enum: ["Open", "Win", "Loss", "BE", "Closed"],
    },
    side: {
        type: String,
        default: "Long",
        enum: ["Long", "Short"],
    },

    openDate: Date,
    closeDate: Date,

    entryCost: {
        type: Number,
        default: 0.0,
    },

    target: Number,

    // The totalNetReturn is also the cost basis when the trade is open.
    netReturn: {
        type: Number,
        default: 0,
    },
    spreadCount: Number,
    spreads: [spreadSchema],
    strikes: [Number],
    instrumentTypes: [String],
    openingSpreadType: String,
});

tradeSchema.plugin(mongoosePaginate);

export const Trade = mongoose.model("Trade", tradeSchema);
