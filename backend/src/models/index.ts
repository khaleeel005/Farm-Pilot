// Centralized model exports
// All models should be imported from this file to ensure consistent access
// and proper association initialization

// Core models
export { default as User } from "./User.js";
export { default as House } from "./House.js";

// Daily operations
export { default as DailyLog } from "./DailyLog.js";

// Sales & Customers
export { default as Sales } from "./Sales.js";
export { default as Customer } from "./Customer.js";

// Feed management
export { default as FeedBatch } from "./FeedBatch.js";
export { default as FeedRecipe } from "./FeedRecipe.js";
export { default as BatchIngredient } from "./BatchIngredient.js";

// Labor management
export { default as Laborer } from "./Laborer.js";
export { default as WorkAssignment } from "./WorkAssignment.js";
export { default as Payroll } from "./Payroll.js";

// Cost management
export { default as CostEntry, CostTypes } from "./CostEntry.js";
export { default as OperatingCost } from "./OperatingCost.js";
export { default as BirdCost } from "./BirdCost.js";

// Initialize all associations
// This must be imported after all models are defined
import "./associations.js";
