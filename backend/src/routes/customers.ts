import express from "express";
import customerController from "../controllers/customerController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateId,
  handleValidation
} from "../middleware/validation.js";

const router = express.Router();

// Apply authentication to all customer routes
router.use(authenticate);

// GET - both owner and staff can read
router.get("/", authorize(PERMISSIONS.CUSTOMERS.READ), customerController.getAll);

router.get("/:id", authorize(PERMISSIONS.CUSTOMERS.READ), validateId, handleValidation, customerController.getById);

// POST - owner only
router.post("/", authorize(PERMISSIONS.CUSTOMERS.CREATE), validateCreateCustomer, handleValidation, customerController.create);

// PUT - owner only
router.put("/:id", authorize(PERMISSIONS.CUSTOMERS.UPDATE), validateUpdateCustomer, handleValidation, customerController.update);

// DELETE - owner only
router.delete("/:id", authorize(PERMISSIONS.CUSTOMERS.DELETE), validateId, handleValidation, customerController.delete);

export default router;
