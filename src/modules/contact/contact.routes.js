import express from "express";
import { contactus } from "./contact.controller.js";
import { authLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();
router.use(authLimiter);

router.post("/", contactus);
export default router;