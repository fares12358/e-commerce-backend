import express from "express";
import { contactus } from "./contact.controller.js";
import { authLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.post("/", authLimiter, contactus);
export default router;