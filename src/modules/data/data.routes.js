import express from "express";
import {
    getWebsiteInitData,
    getShellData,
    getProductsData,
} from "./data.controller.js";
import { usersLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

// Phase 1 — shell: config, content, categories, ads  (fast)
router.get("/shell", usersLimiter, getShellData);

// Phase 2 — products: featured + new products  (heavier)
router.get("/products", usersLimiter, getProductsData);

// Legacy full-init — kept for backward compatibility
router.get("/", usersLimiter, getWebsiteInitData);

export default router;
