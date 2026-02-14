import FeedRecipe from "../models/FeedRecipe.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import type { FeedRecipeEntity } from "../types/entities.js";
import type { FeedRecipeFiltersInput, FeedRecipeUpdateInput } from "../types/dto.js";
import { asEntity } from "../utils/modelHelpers.js";

const feedRecipeService = {
  createFeedRecipe: async (data: Partial<FeedRecipeEntity>) => {
    if (!data.recipeName) {
      throw new BadRequestError("Recipe name is required");
    }

    // Validate percentages
    const totalPercent =
      (Number(data.cornPercent) || 0) +
      (Number(data.soybeanPercent) || 0) +
      (Number(data.wheatBranPercent) || 0) +
      (Number(data.limestonePercent) || 0);

    if (totalPercent > 100) {
      throw new BadRequestError(
        "Total ingredient percentages cannot exceed 100%"
      );
    }

    const recipe = await FeedRecipe.create(data);
    return recipe;
  },

  getAllFeedRecipes: async (filters: FeedRecipeFiltersInput = {}) => {
    const where: { isActive?: boolean } = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const recipes = await FeedRecipe.findAll({ where });
    return recipes;
  },

  getFeedRecipeById: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Feed recipe id is required");
    }
    const recipe = await FeedRecipe.findByPk(id);
    if (!recipe) throw new NotFoundError("Feed recipe not found");
    return recipe;
  },

  updateFeedRecipe: async (
    id: string | number | undefined,
    updates: FeedRecipeUpdateInput,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Feed recipe id is required");
    }
    if (
      updates.cornPercent ||
      updates.soybeanPercent ||
      updates.wheatBranPercent ||
      updates.limestonePercent
    ) {
      const existing = asEntity<FeedRecipeEntity>(await FeedRecipe.findByPk(id));
      if (!existing) throw new NotFoundError("Feed recipe not found");

      const totalPercent =
        (Number(updates.cornPercent ?? existing.cornPercent) || 0) +
        (Number(updates.soybeanPercent ?? existing.soybeanPercent) || 0) +
        (Number(updates.wheatBranPercent ?? existing.wheatBranPercent) || 0) +
        (Number(updates.limestonePercent ?? existing.limestonePercent) || 0);

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

  deleteFeedRecipe: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Feed recipe id is required");
    }
    const deleted = await FeedRecipe.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Feed recipe not found");
    return true;
  },
};

export default feedRecipeService;
