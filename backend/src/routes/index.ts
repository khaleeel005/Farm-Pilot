import express from "express";
import authRoutes from "./auth.js";
import staffRoutes from "./staff.js";
import dailyLogs from "./dailyLogs.js";
import houses from "./houses.js";
import sales from "./sales.js";
import customers from "./customers.js";
import feed from "./feed.js";
import labor from "./labor.js";
import costs from "./costs.js";
import costEntries from "./costEntries.js";
import reports from "./reports.js";

const router = express.Router();

// Authentication & User Management
router.use("/auth", authRoutes);
router.use("/staff", staffRoutes);

// Core Operations
router.use("/daily-logs", dailyLogs);
router.use("/houses", houses);

// Sales & Customers
router.use("/sales", sales);
router.use("/customers", customers);

// Feed Management
router.use("/feed", feed);

// Labor Management (routes define /laborers, /work-assignments, /payroll)
router.use("/", labor);

// Cost Management
router.use("/costs", costs);
router.use("/cost-entries", costEntries);

// Reporting
router.use("/reports", reports);

export default router;
