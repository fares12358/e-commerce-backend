import express from "express";

import { verifyOwnerServer } from "../../middlewares/verifyOwner.js";
import { createControl, deleteControl, getAllControls, getControlById, updateControl } from "./contorlles.controller.js";

const router = express.Router();

// Public or admin routes
router.get("/", getAllControls);
router.get("/:id", getControlById);

// Protected routes (owner only)
router.post("/", verifyOwnerServer, createControl);
router.put("/:id", verifyOwnerServer, updateControl);
router.delete("/:id", verifyOwnerServer, deleteControl);

export default router;