import feedCostCalculator from "../../../src/services/feedCostCalculator.js";

describe("feedCostCalculator", () => {
  test("calculates cost correctly for a simple recipe", () => {
    const recipe = {
      cornPercent: 50,
      soybeanPercent: 50,
    };
    const batchSizeKg = 1000;
    const ingredientPrices = { corn: 2, soybean: 3 }; // price per kg

    const result = feedCostCalculator.calculateFeedBatchCost(
      recipe,
      batchSizeKg,
      ingredientPrices
    );

    // corn: 500kg * 2 = 1000
    // soybean: 500kg * 3 = 1500
    expect(result.totalCost).toBeCloseTo(2500);
    expect(result.costPerKg).toBeCloseTo(2.5);
    expect(result.ingredients).toHaveLength(2);
  });

  test("throws when recipe percentage sum is zero", () => {
    const recipe = { cornPercent: 0 };
    expect(() =>
      feedCostCalculator.calculateFeedBatchCost(recipe, 1000, {})
    ).toThrow();
  });

  test("throws when missing recipe or batchSizeKg", () => {
    expect(() =>
      feedCostCalculator.calculateFeedBatchCost(null, 1000, {})
    ).toThrow();
    expect(() =>
      feedCostCalculator.calculateFeedBatchCost({ cornPercent: 50 }, null, {})
    ).toThrow();
  });
});
