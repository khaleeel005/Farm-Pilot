import express from "express";
import { body } from "express-validator";
import staffController from "../controllers/staffController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import rolesConfig from "../config/roles.js";

const router = express.Router();
const { ROLES } = rolesConfig;

// Owner-only staff management
router.use(authenticate);
router.use(authorize([ROLES.OWNER]));

router.get("/", staffController.listStaff);

router.post(
  "/",
  [body("username").notEmpty(), body("password").isLength({ min: 5 })],
  staffController.createStaff
);

router.put(
  "/:id",
  [body("fullName").optional().notEmpty()],
  staffController.updateStaff
);

router.delete("/:id", staffController.deleteStaff);

export default router;
