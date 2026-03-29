import express from "express";
import inventoryController from "../controllers/inventoryController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /api/inventory/eggs?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/eggs", authenticate, inventoryController.getEggInventory);

// POST /api/inventory/eggs/adjustments
router.post("/eggs/adjustments", authenticate, inventoryController.createEggAdjustment);

export default router;
