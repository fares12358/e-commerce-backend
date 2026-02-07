import express from "express";
import { getWebsiteInitData } from "./data.controller.js";

const router = express.Router();

router.get("/", getWebsiteInitData);

export default router;
