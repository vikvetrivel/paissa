import mongoose from "mongoose";

const Schema = mongoose.Schema;

let portfolioTransactions = new Schema({
    date: Date,
    type: String,
    description: String,
    value: Number,
    action: {
        type: String,
        enum: [
            "None",
            "Buy",
            "Sell",
            "Expiry",
            "Assignment",
            "Exercise",
            "Regulatory Adjustment",
            "Corporate Action",
            "Deposit",
            "Dividend",
            "Interest",
            "Tax Withheld",
            "Misc Money Movements",
            "Transfer",
            "Withdrawal",
        ],
    },
    ticker: String,
});

let portfolioSchema = new Schema({
    broker: String,
    name: String,
    cash: Number,
    transactions: [portfolioTransactions],
});

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);
