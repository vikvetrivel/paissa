import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const executionsSchema = new Schema({
    action: {
        type: String,
        default: "None",
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
    }, // Buying or Seling
    direction: {
        type: String,
        default: "None",
        enum: [
            "None",
            "OpeningTrade",
            "ClosingTrade",
            "FuturesTrade",
            "Expiry",
            "Assignment",
        ],
    }, //Opening trade , closing trade or futures trade
    importDate: Date,
    executionDate: Date,
    price: Number,
    commission: Number,
    fees: Number,
    orderNumber: Number,
    description: String,
});

export const Execution = mongoose.model("Execution", executionsSchema);
