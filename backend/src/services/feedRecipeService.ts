import FeedRecipe from "../models/FeedRecipe.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";

const feedRecipeService = {
  createFeedRecipe: async (data) => {
    if (!data.recipeName) {
      throw new BadRequestError("Recipe name is required");
    }

    // Validate percentages
    const totalPercent =
      (data.cornPercent || 0) +
      (data.soybeanPercent || 0) +
      (data.wheatBranPercent || 0) +
      (data.limestonePercent || 0);

    if (totalPercent > 100) {
      throw new BadRequestError(
        "Total ingredient percentages cannot exceed 100%"
      );
    }

    const recipe = await FeedRecipe.create(data);
    return recipe;
  },

  getAllFeedRecipes: async (filters = {}) => {
    const where = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const recipes = await FeedRecipe.findAll({ where });
    return recipes;
  },

  getFeedRecipeById: async (id) => {
    const recipe = await FeedRecipe.findByPk(id);
    if (!recipe) throw new NotFoundError("Feed recipe not found");
    return recipe;
  },

  updateFeedRecipe: async (id, updates) => {
    if (
      updates.cornPercent ||
      updates.soybeanPercent ||
      updates.wheatBranPercent ||
      updates.limestonePercent
    ) {
      const existing = await FeedRecipe.findByPk(id);
      if (!existing) throw new NotFoundError("Feed recipe not found");

      const totalPercent =
        (updates.cornPercent ?? existing.cornPercent) +
        (updates.soybeanPercent ?? existing.soybeanPercent) +
        (updates.wheatBranPercent ?? existing.wheatBranPercent) +
        (updates.limestonePercent ?? existing.limestonePercent);

      if (totalPercent > 100) {
        throw new BadRequestError(
          "Total ingredient percentages cannot exceed 100%"
        );
      }
    }

    const [updatedCount] = await FeedRecipe.update(updates, { where: { id } });
    if (!updatedCount) throw new NotFoundError("Feed recipe not found");
    const updated = await FeedRecipe.findByPk(id);
    return updated;
  },

  deleteFeedRecipe: async (id) => {
    const deleted = await FeedRecipe.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Feed recipe not found");
    return true;
  },
};

export default feedRecipeService;
