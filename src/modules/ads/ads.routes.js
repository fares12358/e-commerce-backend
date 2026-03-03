import express from "express";
import multer from "multer";
import { createAd, deleteAd, getAdById, getAds, updateAd } from "./ads.controller.js";
import { protectAdmin } from "../admin/admin.auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* Public */
router.get("/", getAds);

/* Admin */
router.use(protectAdmin)
router.post("/", upload.single("image"), createAd);
router.get("/:id", getAdById);
router.put("/:id", upload.single("image"), updateAd);
router.delete("/:id", deleteAd);

export default router;
