import express from "express";
import houseController from "../controllers/houseController.js";
import {
  validateCreateHouse,
  validateUpdateHouse,
  validateId,
  handleValidation
} from "../middleware/validation.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Apply authentication to all house routes
router.use(authenticate);

// GET - both owner and staff can read
router.get("/", authorize(PERMISSIONS.HOUSES.READ), houseController.getAll);

router.get("/:id", authorize(PERMISSIONS.HOUSES.READ), validateId, handleValidation, houseController.getById);

// POST - owner only
router.post("/", authorize(PERMISSIONS.HOUSES.CREATE), validateCreateHouse, handleValidation, houseController.create);

// PUT - owner only
router.put("/:id", authorize(PERMISSIONS.HOUSES.UPDATE), validateUpdateHouse, handleValidation, houseController.update);

// DELETE - owner only
router.delete("/:id", authorize(PERMISSIONS.HOUSES.DELETE), validateId, handleValidation, houseController.delete);

export default router;
