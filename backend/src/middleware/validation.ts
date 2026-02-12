import { body, query, param } from "express-validator";
import { validationResult } from "express-validator";
import DailyLog from "../models/DailyLog.js";
import { BadRequestError } from "../utils/exceptions.js";

export const validateCreateDailyLog = [
  body("logDate")
    .isISO8601()
    .withMessage("logDate must be a valid date (YYYY-MM-DD)"),
  body("houseId")
    .isInt({ min: 1 })
    .withMessage("houseId must be a positive integer"),
  body("eggsCollected")
    .optional()
    .isInt({ min: 0 })
    .withMessage("eggsCollected must be a non-negative integer"),
  body("crackedEggs")
    .optional()
    .isInt({ min: 0 })
    .withMessage("crackedEggs must be a non-negative integer"),
  body("feedGivenKg")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("feedGivenKg must be a non-negative number"),
  body("feedType").custom((value) => {
    if (value === null || value === undefined || value === "") {
      return true; // Allow null, undefined, empty string
    }
    if (typeof value !== "string") {
      throw new Error("feedType must be a string");
    }
    if (value.length > 50) {
      throw new Error("feedType must be max 50 characters");
    }
    return true;
  }),
  body("mortalityCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("mortalityCount must be a non-negative integer"),
  body("notes").custom((value) => {
    if (value === null || value === undefined || value === "") {
      return true; // Allow null, undefined, empty string
    }
    if (typeof value !== "string") {
      throw new Error("notes must be a string");
    }
    if (value.length > 1000) {
      throw new Error("notes must be max 1000 characters");
    }
    return true;
  }),
];

export const validateUpdateDailyLog = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("logDate")
    .optional()
    .isISO8601()
    .withMessage("logDate must be a valid date (YYYY-MM-DD)"),
  body("houseId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("houseId must be a positive integer"),
  body("eggsCollected")
    .optional()
    .isInt({ min: 0 })
    .withMessage("eggsCollected must be a non-negative integer"),
  body("crackedEggs")
    .optional()
    .isInt({ min: 0 })
    .withMessage("crackedEggs must be a non-negative integer"),
  body("feedGivenKg")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("feedGivenKg must be a non-negative number"),
  body("mortalityCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("mortalityCount must be a non-negative integer"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("notes must be a string with max 1000 characters"),
];

export const validateDailyLogQueries = [
  query("date")
    .optional()
    .isISO8601()
    .withMessage("date must be a valid date (YYYY-MM-DD)"),
  query("houseId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("houseId must be a positive integer"),
];

export const validateCreateCustomer = [
  body("customerName")
    .notEmpty()
    .withMessage("customerName is required")
    .isLength({ max: 200 })
    .withMessage("customerName max 200 chars"),
  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("phone max 20 chars"),
  body("email").optional().isEmail().withMessage("email must be valid"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("address max 500 chars"),
];

export const validateUpdateCustomer = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("customerName")
    .optional()
    .notEmpty()
    .withMessage("customerName cannot be empty"),
  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("phone max 20 chars"),
  body("email").optional().isEmail().withMessage("email must be valid"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("address max 500 chars"),
];

export const validateCreateSale = [
  body("saleDate")
    .isISO8601()
    .withMessage("saleDate must be a valid date (YYYY-MM-DD)"),
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("customerId must be a positive integer"),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("quantity must be a non-negative integer"),
  body("pricePerEgg")
    .isFloat({ min: 0 })
    .withMessage("pricePerEgg must be a non-negative number"),
  body("totalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("totalAmount must be a non-negative number"),
  body("paymentMethod")
    .optional()
    .isIn(["cash", "transfer", "check"])
    .withMessage("paymentMethod must be cash, transfer, or check"),
  body("paymentStatus")
    .optional()
    .isIn(["paid", "pending"])
    .withMessage("paymentStatus must be paid or pending"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("notes must be a string with max 1000 characters"),
];

export const validateUpdateSale = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("saleDate")
    .optional()
    .isISO8601()
    .withMessage("saleDate must be a valid date (YYYY-MM-DD)"),
  body("customerId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("customerId must be a positive integer"),
  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("quantity must be a non-negative integer"),
  body("pricePerEgg")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("pricePerEgg must be a non-negative number"),
  body("totalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("totalAmount must be a positive number"),
  body("paymentMethod")
    .optional()
    .isIn(["cash", "transfer", "check"])
    .withMessage("paymentMethod must be cash, transfer, or check"),
  body("paymentStatus")
    .optional()
    .isIn(["paid", "pending"])
    .withMessage("paymentStatus must be paid or pending"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("notes must be a string with max 1000 characters"),
];

export const validateSalesQueries = [
  query("date")
    .optional()
    .isISO8601()
    .withMessage("date must be a valid date (YYYY-MM-DD)"),
  query("customer")
    .optional()
    .isInt({ min: 1 })
    .withMessage("customer must be a positive integer"),
  query("customerId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("customerId must be a positive integer"),
];

export const validateId = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
];

// Feed validators
export const validateCreateFeedBatch = [
  body("batchDate")
    .isISO8601()
    .withMessage("batchDate must be a valid date (YYYY-MM-DD)"),
  body("batchName")
    .notEmpty()
    .withMessage("batchName is required")
    .isLength({ max: 100 })
    .withMessage("batchName max 100 chars"),
  body("ingredients")
    .isArray({ min: 1 })
    .withMessage("ingredients must be an array with at least one item"),
  body("ingredients.*.ingredientName")
    .notEmpty()
    .withMessage("ingredientName is required for each ingredient"),
  body("ingredients.*.quantityKg")
    .isFloat({ min: 0.01 })
    .withMessage("quantityKg must be a positive number for each ingredient"),
  body("ingredients.*.totalCost")
    .isFloat({ min: 0.01 })
    .withMessage("totalCost must be a positive number for each ingredient"),
  body("ingredients.*.supplier")
    .optional()
    .isLength({ max: 100 })
    .withMessage("supplier max 100 chars"),
  body("bagSizeKg")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("bagSizeKg must be at least 1 kg"),
];

export const validateAddBatchIngredient = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("batch id must be a positive integer"),
  body("ingredientName")
    .notEmpty()
    .withMessage("ingredientName is required")
    .isLength({ max: 100 })
    .withMessage("ingredientName max 100 chars"),
  body("quantityKg")
    .isFloat({ min: 0.01 })
    .withMessage("quantityKg must be a positive number"),
  body("totalCost")
    .isFloat({ min: 0.01 })
    .withMessage("totalCost must be a positive number"),
  body("supplier")
    .optional()
    .isLength({ max: 100 })
    .withMessage("supplier max 100 chars"),
];

// House validators
export const validateCreateHouse = [
  body("houseName")
    .notEmpty()
    .withMessage("houseName is required")
    .isLength({ max: 50 })
    .withMessage("houseName max 50 chars"),
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("capacity must be a positive integer"),
  body("currentBirdCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("currentBirdCount must be non-negative"),
  body("location")
    .optional()
    .isLength({ max: 100 })
    .withMessage("location max 100 chars"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("description max 500 chars"),
];

export const validateUpdateHouse = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("houseName")
    .optional()
    .notEmpty()
    .withMessage("houseName cannot be empty")
    .isLength({ max: 50 })
    .withMessage("houseName max 50 chars"),
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("capacity must be a positive integer"),
  body("currentBirdCount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("currentBirdCount must be non-negative"),
  body("location")
    .optional()
    .isLength({ max: 100 })
    .withMessage("location max 100 chars"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("description max 500 chars"),
];

// Helper to run validationResult and return 400 if errors
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Labor validators
export const validateCreateLaborer = [
  body("employeeId")
    .optional()
    .isLength({ max: 20 })
    .withMessage("employeeId max 20 chars"),
  body("fullName")
    .notEmpty()
    .withMessage("fullName is required")
    .isLength({ max: 100 })
    .withMessage("fullName max 100 chars"),
  body("phone")
    .notEmpty()
    .isLength({ max: 20 })
    .withMessage("phone is required and max 20 chars"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("address max 500 chars"),
  body("monthlySalary")
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage("monthlySalary is required and must be non-negative"),
  body("hireDate")
    .optional()
    .isISO8601()
    .withMessage("hireDate must be a valid date"),
  body("isActive").optional().isBoolean(),
  body("emergencyContact")
    .optional()
    .isLength({ max: 100 })
    .withMessage("emergencyContact max 100 chars"),
  body("emergencyPhone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("emergencyPhone max 20 chars"),
];

export const validateUpdateLaborer = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("employeeId")
    .optional()
    .isLength({ max: 20 })
    .withMessage("employeeId max 20 chars"),
  body("fullName")
    .optional()
    .notEmpty()
    .withMessage("fullName cannot be empty")
    .isLength({ max: 100 })
    .withMessage("fullName max 100 chars"),
  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("phone max 20 chars"),
  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("address max 500 chars"),
  body("monthlySalary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("monthlySalary must be non-negative"),
  body("hireDate")
    .optional()
    .isISO8601()
    .withMessage("hireDate must be a valid date"),
  body("isActive").optional().isBoolean(),
  body("emergencyContact")
    .optional()
    .isLength({ max: 100 })
    .withMessage("emergencyContact max 100 chars"),
  body("emergencyPhone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("emergencyPhone max 20 chars"),
];

export const validateCreateWorkAssignment = [
  body("laborerId")
    .isInt({ min: 1 })
    .withMessage("laborerId is required and must be a positive integer"),
  body("date")
    .isISO8601()
    .withMessage("date is required and must be a valid date"),
  body("tasksAssigned")
    .optional()
    .isArray()
    .withMessage("tasksAssigned must be an array of task strings"),
  body("attendanceStatus")
    .optional()
    .isIn(["present", "absent", "half_day", "late"])
    .withMessage(
      "attendanceStatus must be one of present, absent, half_day, late"
    ),
  body("hours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("hours must be non-negative"),
];

export const validateUpdateWorkAssignment = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  body("tasksAssigned").optional().isArray(),
  body("attendanceStatus")
    .optional()
    .isIn(["present", "absent", "half_day", "late"]),
  body("hours")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("hours must be non-negative"),
];

export const validateGeneratePayroll = [
  param("month_year")
    .notEmpty()
    .withMessage("month_year is required in format YYYY-MM"),
];
