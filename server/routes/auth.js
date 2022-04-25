import express from "express";

const router = express.Router();

import {signup, signin} from "../controllers/auth.js";

router.post("/signup", signup);
router.post("/signin", signin);

//module.exports = router;

export default router;
