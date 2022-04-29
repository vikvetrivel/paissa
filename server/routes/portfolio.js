import express from "express";

const router = express.Router();

import {
    createPortfolio,
    get,
    getPortfolioValue,
    getTickers,
    getPortfolioMetaData,
} from "../controllers/portfolio.js";

router.get("/", get);
router.get("/value", getPortfolioValue);
router.post("/create", createPortfolio);
router.get("/tickers", getTickers);
router.get("/meta", getPortfolioMetaData);

export default router;
