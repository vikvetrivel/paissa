import express from "express";

const router = express.Router();

import { getLegs, importExecutionsFromFile } from "../controllers/leg.js";
import {
    createPortfolio,
    get,
    getPortfolioValue,
    getTickers,
} from "../controllers/portfolio.js";
import {
    getTrades,
    getDetailedTrades,
    setTrades,
} from "../controllers/trade.js";

router.get("/trades/", getTrades);
router.get("/trades/detail", getDetailedTrades);
router.post("/trades/", setTrades);
router.post("/importExecutions/", importExecutionsFromFile);
router.get("/legs/", getLegs);
router.get("/portfolio", get);
router.get("/portfolioValue", getPortfolioValue);
router.post("/createPortfolio", createPortfolio);
router.get("/portfolio/tickers", getTickers);

export default router;
