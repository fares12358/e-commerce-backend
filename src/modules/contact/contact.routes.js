import express from "express";
import { contactus } from "./contact.controller.js";

const router = express.Router();
router.post("/", contactus);
export default router;