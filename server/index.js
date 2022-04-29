import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";

//Import routes
import authRoutes from "./routes/auth.js";
import tradeRoutes from "./routes/trade.js";
import portfolioRoutes from "./routes/portfolio.js";
import { pricePopulator } from "./controllers/pricePopulator.js";

import cron from "node-cron";

//Application
const app = express();
const PORT = 8000;
const DATABASE =
    "mongodb+srv://admin:V12345ikram@cluster0.ix5pj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

//MongoDB Database Connection

mongoose.connect(DATABASE, {}).then(() => console.log("MongoDB Connected"));

//Middlewares
app.use(bodyParser.json());
app.use(Cors());

//Routes Middleware
app.use("/api/", tradeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.listen(PORT, () => {
    console.log(`Paissa - Listening on port ${PORT}`);
});

//pricePopulator();

cron.schedule("* * 6 * * *", () => {
    console.log("Cron job running once every 6 hours");
    pricePopulator();
});
