import { BadRequestError } from "../utils/exceptions.js";

/**
 * calculateFeedBatchCost(recipe, batchSizeKg, ingredientPrices)
 * recipe: object with ingredient percentages, e.g. { cornPercent: 40, soybeanPercent: 25, wheatBranPercent: 20, limestonePercent: 10, otherIngredients: { premix: 5 } }
 * ingredientPrices: { corn: 200, soybean: 300, wheatBran: 150, limestone: 100, premix: 500 }
 */
type RecipeInput = {
  cornPercent?: number | string;
  corn_percent?: number | string;
  corn?: number | string;
  soybeanPercent?: number | string;
  soybean_percent?: number | string;
  soybean?: number | string;
  wheatBranPercent?: number | string;
  wheat_bran_percent?: number | string;
  wheatBran?: number | string;
  limestonePercent?: number | string;
  limestone_percent?: number | string;
  limestone?: number | string;
  otherIngredients?: Record<string, number | string> | null;
};

type IngredientEntry = {
  name: string;
  percent: number;
};

type IngredientPrices = Record<string, number>;

const toNumber = (value: number | string | undefined): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const calculateFeedBatchCost = (
  recipe: RecipeInput,
  batchSizeKg: number,
  ingredientPrices: IngredientPrices = {},
) => {
  if (!recipe || !batchSizeKg)
    throw new BadRequestError("recipe and batchSizeKg are required");

  // Build a normalized map of ingredient percentages from recipe
  const entries: IngredientEntry[] = [];
  const pushIf = (key: string, percent: number | string | undefined) => {
    const numericPercent = toNumber(percent);
    if (numericPercent > 0) {
      entries.push({ name: key, percent: numericPercent });
    }
  };

  pushIf("corn", recipe.cornPercent || recipe.corn_percent || recipe.corn || 0);
  pushIf(
    "soybean",
    recipe.soybeanPercent || recipe.soybean_percent || recipe.soybean || 0
  );
  pushIf(
    "wheatBran",
    recipe.wheatBranPercent ||
      recipe.wheat_bran_percent ||
      recipe.wheatBran ||
      0
  );
  pushIf(
    "limestone",
    recipe.limestonePercent || recipe.limestone_percent || recipe.limestone || 0
  );

  // include otherIngredients if present (assumed percentages)
  if (recipe.otherIngredients && typeof recipe.otherIngredients === "object") {
    for (const [k, v] of Object.entries(recipe.otherIngredients)) {
      pushIf(k, v);
    }
  }

  // Sum percentages
  const totalPercent = entries.reduce((s, e) => s + e.percent, 0);
  if (totalPercent <= 0)
    throw new BadRequestError("recipe percentages must sum to > 0");

  let totalCost = 0;
  const ingredients: Array<{
    name: string;
    amountKg: number;
    costPerKg: number;
    totalCost: number;
  }> = [];
  for (const e of entries) {
    const amountKg = (batchSizeKg * e.percent) / 100;
    const pricePerKg = ingredientPrices[e.name] || 0;
    const cost = amountKg * pricePerKg;
    ingredients.push({
      name: e.name,
      amountKg,
      costPerKg: pricePerKg,
      totalCost: cost,
    });
    totalCost += cost;
  }

  return {
    batchSizeKg,
    totalCost,
    costPerKg: batchSizeKg ? totalCost / batchSizeKg : 0,
    ingredients,
  };
};

export default { calculateFeedBatchCost };
