import { FeedBatch, BatchIngredient } from "../models/associations.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import { Op } from "sequelize";

const feedBatchService = {
  createFeedBatch: async (data) => {
    if (
      !data.batchDate ||
      !data.batchName ||
      !data.ingredients ||
      !Array.isArray(data.ingredients)
    ) {
      throw new BadRequestError(
        "batchDate, batchName, and ingredients array are required",
      );
    }

    // Calculate totals from ingredients
    const ingredientsCost = data.ingredients.reduce(
      (sum, ing) => sum + Number(ing.totalCost),
      0,
    );
    const miscellaneousCost = Number(data.miscellaneousCost) || 0;
    const totalCost = ingredientsCost + miscellaneousCost;
    const totalQuantityKg = data.ingredients.reduce(
      (sum, ing) => sum + Number(ing.quantityKg),
      0,
    );
    const totalQuantityTons = totalQuantityKg / 1000;

    const bagSizeKg = data.bagSizeKg || 50;
    const totalBags =
      totalQuantityKg > 0 ? Math.ceil(totalQuantityKg / bagSizeKg) : 0;
    const costPerBag = totalBags > 0 ? totalCost / totalBags : 0;
    const costPerKg = totalQuantityKg > 0 ? totalCost / totalQuantityKg : 0;

    // Create the batch
    const batchData = {
      batchDate: data.batchDate,
      batchName: data.batchName,
      totalQuantityTons,
      bagSizeKg,
      totalBags,
      totalCost,
      costPerBag,
      costPerKg,
      miscellaneousCost,
    };

    const batch = await FeedBatch.create(batchData);

    // Add ingredients
    const ingredientsWithBatchId = data.ingredients.map((ingredient) => ({
      batchId: batch.id,
      ingredientName: ingredient.ingredientName,
      quantityKg: ingredient.quantityKg,
      totalCost: ingredient.totalCost,
      costPerKg: ingredient.totalCost / ingredient.quantityKg,
      supplier: ingredient.supplier || null,
    }));

    await BatchIngredient.bulkCreate(ingredientsWithBatchId);

    // Return batch (without ingredients for now due to association issue)
    return await FeedBatch.findByPk(batch.id);
  },

  getAllFeedBatches: async (filters = {}) => {
    const where = {};

    if (filters.date || filters.batchDate) {
      where.batchDate = filters.date || filters.batchDate;
    }

    if (filters.batchName) {
      where.batchName = { [Op.iLike]: `%${filters.batchName}%` };
    }

    const batches = await FeedBatch.findAll({
      where,
      include: [
        {
          model: BatchIngredient,
          as: "ingredients",
        },
      ],
      order: [["batchDate", "DESC"]],
    });
    return batches;
  },

  getFeedBatchById: async (id) => {
    const batch = await FeedBatch.findByPk(id, {
      include: [
        {
          model: BatchIngredient,
          as: "ingredients",
        },
      ],
    });
    if (!batch) throw new NotFoundError("Feed batch not found");
    return batch;
  },

  updateFeedBatch: async (id, updates) => {
    const batch = await FeedBatch.findByPk(id);
    if (!batch) throw new NotFoundError("Feed batch not found");

    // If ingredients are being updated, recalculate totals
    if (updates.ingredients && Array.isArray(updates.ingredients)) {
      const ingredientsCost = updates.ingredients.reduce(
        (sum, ing) => sum + Number(ing.totalCost),
        0,
      );
      // Use updated miscellaneousCost if provided, else keep existing
      const miscellaneousCost =
        updates.miscellaneousCost !== undefined
          ? Number(updates.miscellaneousCost)
          : Number(batch.miscellaneousCost) || 0;
      const totalCost = ingredientsCost + miscellaneousCost;
      const totalQuantityKg = updates.ingredients.reduce(
        (sum, ing) => sum + Number(ing.quantityKg),
        0,
      );
      const totalQuantityTons = totalQuantityKg / 1000;

      const bagSizeKg = updates.bagSizeKg || batch.bagSizeKg;
      const totalBags =
        totalQuantityKg > 0 ? Math.ceil(totalQuantityKg / bagSizeKg) : 0;
      const costPerBag = totalBags > 0 ? totalCost / totalBags : 0;
      const costPerKg = totalQuantityKg > 0 ? totalCost / totalQuantityKg : 0;

      updates.totalQuantityTons = totalQuantityTons;
      updates.totalBags = totalBags;
      updates.totalCost = totalCost;
      updates.costPerBag = costPerBag;
      updates.costPerKg = costPerKg;
      updates.miscellaneousCost = miscellaneousCost;

      // Update ingredients
      await BatchIngredient.destroy({ where: { batchId: id } });
      const ingredientsWithBatchId = updates.ingredients.map((ingredient) => ({
        batchId: id,
        ingredientName: ingredient.ingredientName,
        quantityKg: ingredient.quantityKg,
        totalCost: ingredient.totalCost,
        costPerKg: ingredient.totalCost / ingredient.quantityKg,
        supplier: ingredient.supplier || null,
      }));
      await BatchIngredient.bulkCreate(ingredientsWithBatchId);

      delete updates.ingredients;
    }

    await batch.update(updates);
    const updated = await FeedBatch.findByPk(id, {
      include: [
        {
          model: BatchIngredient,
          as: "ingredients",
        },
      ],
    });
    return updated;
  },

  deleteFeedBatch: async (id) => {
    const deleted = await FeedBatch.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Feed batch not found");
    return true;
  },

  getBatchIngredients: async (batchId) => {
    const ingredients = await BatchIngredient.findAll({
      where: { batchId },
    });
    return ingredients;
  },

  addBatchIngredient: async (batchId, ingredientData) => {
    const batch = await FeedBatch.findByPk(batchId);
    if (!batch) throw new NotFoundError("Feed batch not found");

    const costPerKg = ingredientData.totalCost / ingredientData.quantityKg;
    const ingredient = await BatchIngredient.create({
      batchId,
      ingredientName: ingredientData.ingredientName,
      quantityKg: ingredientData.quantityKg,
      totalCost: ingredientData.totalCost,
      costPerKg,
      supplier: ingredientData.supplier || null,
    });

    // Recalculate batch totals
    await feedBatchService.recalculateBatchTotals(batchId);

    return ingredient;
  },

  updateBatchIngredient: async (ingredientId, updates) => {
    const ingredient = await BatchIngredient.findByPk(ingredientId);
    if (!ingredient) throw new NotFoundError("Ingredient not found");

    if (updates.quantityKg && updates.totalCost) {
      updates.costPerKg = updates.totalCost / updates.quantityKg;
    }

    await ingredient.update(updates);

    // Recalculate batch totals
    await feedBatchService.recalculateBatchTotals(ingredient.batchId);

    return ingredient;
  },

  removeBatchIngredient: async (ingredientId) => {
    const ingredient = await BatchIngredient.findByPk(ingredientId);
    if (!ingredient) throw new NotFoundError("Ingredient not found");

    const batchId = ingredient.batchId;
    await ingredient.destroy();

    // Recalculate batch totals
    await feedBatchService.recalculateBatchTotals(batchId);

    return true;
  },

  recalculateBatchTotals: async (batchId) => {
    const batch = await FeedBatch.findByPk(batchId);
    const ingredients = await BatchIngredient.findAll({ where: { batchId } });

    const ingredientsCost = ingredients.reduce(
      (sum, ing) => sum + Number(ing.totalCost),
      0,
    );
    const miscellaneousCost = Number(batch.miscellaneousCost) || 0;
    const totalCost = ingredientsCost + miscellaneousCost;
    const totalQuantityKg = ingredients.reduce(
      (sum, ing) => sum + Number(ing.quantityKg),
      0,
    );
    const totalQuantityTons = totalQuantityKg / 1000;

    const totalBags = Math.ceil(totalQuantityKg / batch.bagSizeKg);
    const costPerBag = totalBags > 0 ? totalCost / totalBags : 0;
    const costPerKg = totalQuantityKg > 0 ? totalCost / totalQuantityKg : 0;

    await batch.update({
      totalQuantityTons,
      totalBags,
      totalCost,
      costPerBag,
      costPerKg,
    });

    return batch;
  },

  calculateBatchCost: async (
    ingredients,
    bagSizeKg = 50,
    miscellaneousCost = 0,
  ) => {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new BadRequestError("Ingredients array is required");
    }

    const ingredientsCost = ingredients.reduce(
      (sum, ing) => sum + Number(ing.totalCost),
      0,
    );
    const miscCost = Number(miscellaneousCost) || 0;
    const totalCost = ingredientsCost + miscCost;
    const totalQuantityKg = ingredients.reduce(
      (sum, ing) => sum + Number(ing.quantityKg),
      0,
    );
    const totalQuantityTons = totalQuantityKg / 1000;

    const totalBags = Math.ceil(totalQuantityKg / bagSizeKg);
    const costPerBag = totalBags > 0 ? totalCost / totalBags : 0;
    const costPerKg = totalQuantityKg > 0 ? totalCost / totalQuantityKg : 0;

    return {
      totalQuantityKg,
      totalQuantityTons,
      bagSizeKg,
      totalBags,
      ingredientsCost,
      miscellaneousCost: miscCost,
      totalCost,
      costPerBag,
      costPerKg,
      ingredients: ingredients.map((ing) => ({
        ...ing,
        costPerKg: ing.totalCost / ing.quantityKg,
      })),
    };
  },
};

export default feedBatchService;
