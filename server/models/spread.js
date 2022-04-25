import mongoose from "mongoose";
import { legSchema } from "./leg.js";

const Schema = mongoose.Schema;

export const spreadSchema = new Schema({
    spreadType: String,
    status: {
        type: String,
        default: "Open",
        enum: ["Open", "Closed"],
    },
    howOpened: {
        type: String,
        default: "New",
        enum: ["New", "Rolled In"],
    },
    howClosed: {
        type: String,
        default: "Closed",
        enum: ["Closed", "Rolled Out", "Still Open"],
    },
    nextSpread: {
        type: String,
        ref: "Spread",
    },
    prevSpread: {
        type: String,
        ref: "Spread",
    },
    legs: [legSchema],

    netReturn: {
        type: Number,
        default: 0.0,
    },
    entryCost: {
        type: Number,
        default: 0.0,
    },

    earliestExpiration: Date,
    openDate: Date,
    closeDate: Date,
    strikes: [Number],
    legCount: Number,
    instrumentTypes: [String],
});

export const Spread = mongoose.model("Spread", spreadSchema);
