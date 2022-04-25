import mongoose from "mongoose";

const Schema = mongoose.Schema;

let companiesSchema = new Schema({
    country: String,
    currency: String,
    exchange: String,
    ipo: Date,
    marketCapitalization: Number,
    name: String,
    phone: String,
    sharesOutstanding: Number,
    weburl: String,
    logo: String,
    finnhubIndustry: String,
    ticker: String,
});

export const Company = mongoose.model("Company", companiesSchema);
