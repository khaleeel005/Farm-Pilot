/**
 * calculateFeedBatchCost(recipe, batchSizeKg, ingredientPrices)
 * recipe: object with ingredient percentages, e.g. { cornPercent: 40, soybeanPercent: 25, wheatBranPercent: 20, limestonePercent: 10, otherIngredients: { premix: 5 } }
 * ingredientPrices: { corn: 200, soybean: 300, wheatBran: 150, limestone: 100, premix: 500 }
 */
const calculateFeedBatchCost = (recipe, batchSizeKg, ingredientPrices = {}) => {
  if (!recipe || !batchSizeKg)
    throw new Error("recipe and batchSizeKg are required");

  // Build a normalized map of ingredient percentages from recipe
  const entries = [];
  const pushIf = (key, percent) => {
    if (percent && Number(percent) > 0)
      entries.push({ name: key, percent: Number(percent) });
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
  if (totalPercent <= 0) throw new Error("recipe percentages must sum to > 0");

  let totalCost = 0;
  const ingredients = [];
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
