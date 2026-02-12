import express from "express";
import salesController from "../controllers/salesController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import {
  validateCreateSale,
  validateUpdateSale,
  validateSalesQueries,
  validateId,
  handleValidation,
} from "../middleware/validation.js";

const router = express.Router();

// Apply authentication to all sales routes
router.use(authenticate);

// GET - both owner and staff can read
router.get("/", authorize(PERMISSIONS.SALES.READ), validateSalesQueries, handleValidation, salesController.getAll);

router.get("/:id", authorize(PERMISSIONS.SALES.READ), validateId, handleValidation, salesController.getById);

// POST - owner only
router.post("/", authorize(PERMISSIONS.SALES.CREATE), validateCreateSale, handleValidation, salesController.create);

// PUT - owner only
router.put("/:id", authorize(PERMISSIONS.SALES.UPDATE), validateUpdateSale, handleValidation, salesController.update);

// DELETE - owner only
router.delete("/:id", authorize(PERMISSIONS.SALES.DELETE), validateId, handleValidation, salesController.delete);

export default router;
