import express from "express";
import { getStoreStats } from "./stats.controller.js";
import { getPendingOrders ,getOrderDetails, updateOrderStatusBot } from "./pendingOrders.controller.js";

const router = express.Router();

router.get("/stats", getStoreStats);
router.get("/pending-orders", getPendingOrders);
router.get("/orders-details/:id", getOrderDetails);
router.put("/orders-status/:number/:status", updateOrderStatusBot);

export default router;