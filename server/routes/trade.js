import express from "express";

const router = express.Router();

import { getLegs, importExecutionsFromFile } from "../controllers/leg.js";

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

export default router;
