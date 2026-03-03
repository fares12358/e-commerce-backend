import express from "express";
import { getWebsiteInitData } from "./data.controller.js";
import { usersLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.use(usersLimiter);
router.get("/", getWebsiteInitData);

export default router;
