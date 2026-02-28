import express from "express";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "./notification.controller.js";
import { protectAdmin } from "../admin/admin.auth.js";
import { telegramWebhook } from "../../config/telegram.webhook.js";

const router = express.Router();

router.get("/",protectAdmin, getNotificationSettings);
router.put("/",protectAdmin, updateNotificationSettings);
router.post("/telegram/webhook", telegramWebhook);

export default router;