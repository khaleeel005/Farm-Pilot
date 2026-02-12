import { body, param } from "express-validator";

export const validateBatchCostCalculation = [
  body("ingredients")
    .isArray({ min: 1 })
    .withMessage("ingredients must be an array with at least one item"),
  body("ingredients.*.ingredientName")
    .notEmpty()
    .withMessage("ingredientName is required for each ingredient"),
  body("ingredients.*.quantityKg")
    .isNumeric()
    .withMessage("quantityKg must be a number for each ingredient"),
  body("ingredients.*.totalCost")
    .isNumeric()
    .withMessage("totalCost must be a number for each ingredient"),
  body("bagSizeKg")
    .optional()
    .isNumeric()
    .withMessage("bagSizeKg must be a number"),
];
