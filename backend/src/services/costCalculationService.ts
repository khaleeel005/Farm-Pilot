import costService from "./costService.js";

// Lightweight bridge exposing the cost calculation functions referenced in
// architecture docs. Keeps a single implementation in costService while
// providing a dedicated module name for future refactors.
const costCalculationService = {
  calculateDailyCost: costService.calculateDailyCost,
  getEggPriceEstimate: costService.getEggPriceEstimate,
  updateDailyCosts: async (date: string) => {
    // optional helper used by some legacy code paths: compute and persist daily_costs
    const calc = await costService.calculateDailyCost(date);
    // persist into daily_costs table if model exists
    try {
      const models = (await import("../models/index.js")) as Record<
        string,
        { upsert?: (payload: Record<string, unknown>) => Promise<unknown> }
      >;
      const dailyCostModel = models.DailyCost;
      if (dailyCostModel?.upsert) {
        await dailyCostModel.upsert({
          cost_date: date,
          total_feed_cost: calc.feedCostPerEgg * calc.totalEggs || 0,
          total_eggs_produced: calc.totalEggs || 0,
          feed_cost_per_egg: calc.feedCostPerEgg || 0,
          fixed_cost_per_egg: calc.fixedCostPerEgg || 0,
          health_cost_per_egg: calc.healthCostPerEgg || 0,
          total_cost_per_egg: calc.totalCostPerEgg || 0,
          suggested_price: calc.suggestedPrice,
        });
      }
    } catch {
      // non-fatal; model may not exist or DB not migrated yet
      // console.warn("Could not persist daily cost:", e);
    }
    return calc;
  },
};

export default costCalculationService;
