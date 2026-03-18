import express from "express";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "./notification.controller.js";
import { protectAdmin } from "../admin/admin.auth.js";

const router = express.Router();

router.get("/",protectAdmin, getNotificationSettings);

router.put("/",protectAdmin, updateNotificationSettings);

export default router;