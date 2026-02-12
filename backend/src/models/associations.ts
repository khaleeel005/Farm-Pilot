// Model Associations
// This file defines all relationships between models
// It should be imported after all models are defined

import FeedBatch from "./FeedBatch.js";
import BatchIngredient from "./BatchIngredient.js";
import House from "./House.js";
import DailyLog from "./DailyLog.js";
import CostEntry from "./CostEntry.js";
import User from "./User.js";
import Customer from "./Customer.js";
import Sales from "./Sales.js";
import Laborer from "./Laborer.js";
import WorkAssignment from "./WorkAssignment.js";
import Payroll from "./Payroll.js";

// ============================================
// Feed Management Associations
// ============================================

// FeedBatch <-> BatchIngredient (One-to-Many)
FeedBatch.hasMany(BatchIngredient, {
  foreignKey: "batchId",
  as: "ingredients",
});

BatchIngredient.belongsTo(FeedBatch, {
  foreignKey: "batchId",
  as: "batch",
});

// FeedBatch <-> DailyLog (One-to-Many)
FeedBatch.hasMany(DailyLog, {
  foreignKey: "feedBatchId",
  as: "dailyLogs",
});

DailyLog.belongsTo(FeedBatch, {
  foreignKey: "feedBatchId",
  as: "FeedBatch",
});

// ============================================
// House Associations
// ============================================

// House <-> DailyLog (One-to-Many)
House.hasMany(DailyLog, {
  foreignKey: "houseId",
  as: "dailyLogs",
});

DailyLog.belongsTo(House, {
  foreignKey: "houseId",
  as: "House",
});

// House <-> CostEntry (One-to-Many)
House.hasMany(CostEntry, {
  foreignKey: "houseId",
  as: "costEntries",
});

CostEntry.belongsTo(House, {
  foreignKey: "houseId",
  as: "house",
});

// ============================================
// User Associations
// ============================================

// User <-> CostEntry (One-to-Many) - Created by relationship
User.hasMany(CostEntry, {
  foreignKey: "createdBy",
  as: "costEntries",
});

CostEntry.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// User <-> DailyLog (One-to-Many) - Supervisor relationship
User.hasMany(DailyLog, {
  foreignKey: "supervisorId",
  as: "dailyLogs",
});

DailyLog.belongsTo(User, {
  foreignKey: "supervisorId",
  as: "supervisor",
});

// User <-> Sales (One-to-Many) - Supervisor relationship
User.hasMany(Sales, {
  foreignKey: "supervisorId",
  as: "sales",
});

Sales.belongsTo(User, {
  foreignKey: "supervisorId",
  as: "supervisor",
});

// ============================================
// Customer & Sales Associations
// ============================================

// Customer <-> Sales (One-to-Many)
Customer.hasMany(Sales, {
  foreignKey: "customerId",
  as: "sales",
});

Sales.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// ============================================
// Labor Management Associations
// ============================================

// Laborer <-> WorkAssignment (One-to-Many)
Laborer.hasMany(WorkAssignment, {
  foreignKey: "laborerId",
  as: "assignments",
});

WorkAssignment.belongsTo(Laborer, {
  foreignKey: "laborerId",
  as: "laborer",
});

// Laborer <-> Payroll (One-to-Many)
Laborer.hasMany(Payroll, {
  foreignKey: "laborerId",
  as: "payrolls",
});

Payroll.belongsTo(Laborer, {
  foreignKey: "laborerId",
  as: "laborer",
});

// ============================================
// Export all models with associations
// ============================================

export {
  FeedBatch,
  BatchIngredient,
  House,
  DailyLog,
  CostEntry,
  User,
  Customer,
  Sales,
  Laborer,
  WorkAssignment,
  Payroll,
};
