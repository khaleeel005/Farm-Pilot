import { FeedBatch, BatchIngredient, DailyLog } from "../models/associations.js";
import {
  NotFoundError,
  BadRequestError,
  InternalServerError,
} from "../utils/exceptions.js";
import { Op } from "sequelize";
import type { Transaction } from "sequelize";
import type {
  BatchIngredientEntity,
  FeedBatchEntity,
} from "../types/entities.js";
import type {
  FeedBatchCreateInput,
  FeedBatchFiltersInput,
  FeedBatchIngredientInput,
  FeedBatchUpdateInput,
} from "../types/dto.js";
import { asEntity } from "../utils/modelHelpers.js";

type FeedBatchWhere = {
  batchDate?: string;
  batchName?: {
    [Op.iLike]: string;
  };
};

const ensureId = (
  id: string | number | undefined,
  label: string,
): string | number => {
  if (id === undefined || id === null || id === "") {
    throw new BadRequestError(`${label} is required`);
  }

  return id;
};

function getSequelize() {
  const sequelize = FeedBatch.sequelize;
  if (!sequelize) {
    throw new InternalServerError(
      "Sequelize instance is not available for feed batch operations",
    );
  }
  return sequelize;
}

async function withTransaction<T>(
  work: (transaction: Transaction) => Promise<T>,
  transaction?: Transaction,
): Promise<T> {
  if (transaction) {
    return work(transaction);
  }

  const sequelize = getSequelize();
  return sequelize.transaction(work);
}

const feedBatchService = {
  createFeedBatch: async (data: FeedBatchCreateInput) => {
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
      (sum, ing: FeedBatchIngredientInput) => sum + Number(ing.totalCost),
      0,
    );
    const miscellaneousCost = Number(data.miscellaneousCost) || 0;
    const totalCost = ingredientsCost + miscellaneousCost;
    const totalQuantityKg = data.ingredients.reduce(
      (sum, ing: FeedBatchIngredientInput) => sum + Number(ing.quantityKg),
      0,
    );
    const totalQuantityTons = totalQuantityKg / 1000;

    const bagSizeKg = Number(data.bagSizeKg) || 50;
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

    const sequelize = getSequelize();
    return sequelize.transaction(async (transaction) => {
      const batch = asEntity<FeedBatchEntity>(
        await FeedBatch.create(batchData, { transaction }),
      );
      if (!batch) {
        throw new BadRequestError("Failed to create feed batch");
      }

      // Add ingredients
      const ingredientsWithBatchId = data.ingredients.map((ingredient) => ({
        batchId: batch.id,
        ingredientName: ingredient.ingredientName,
        quantityKg: ingredient.quantityKg,
        totalCost: ingredient.totalCost,
        costPerKg: Number(ingredient.totalCost) / Number(ingredient.quantityKg),
        supplier: ingredient.supplier || null,
      }));

      await BatchIngredient.bulkCreate(ingredientsWithBatchId, { transaction });

      // Return batch with transaction scope
      return await FeedBatch.findByPk(batch.id, { transaction });
    });
  },

  getAllFeedBatches: async (filters: FeedBatchFiltersInput = {}) => {
    const where: FeedBatchWhere = {};

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

  getFeedBatchById: async (id: string | number | undefined) => {
    const batchId = ensureId(id, "Feed batch id");
    const batch = await FeedBatch.findByPk(batchId, {
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

  updateFeedBatch: async (
    id: string | number | undefined,
    updates: FeedBatchUpdateInput,
  ) => {
    const batchId = ensureId(id, "Feed batch id");
    const sequelize = getSequelize();
    return sequelize.transaction(async (transaction) => {
      const batch = asEntity<FeedBatchEntity>(
        await FeedBatch.findByPk(batchId, { transaction }),
      );
      if (!batch) throw new NotFoundError("Feed batch not found");

      // If ingredients are being updated, recalculate totals
      if (updates.ingredients && Array.isArray(updates.ingredients)) {
        const ingredientsCost = updates.ingredients.reduce(
          (sum, ing: FeedBatchIngredientInput) => sum + Number(ing.totalCost),
          0,
        );
        // Use updated miscellaneousCost if provided, else keep existing
        const miscellaneousCost =
          updates.miscellaneousCost !== undefined
            ? Number(updates.miscellaneousCost)
            : Number(batch.miscellaneousCost) || 0;
        const totalCost = ingredientsCost + miscellaneousCost;
        const totalQuantityKg = updates.ingredients.reduce(
          (sum, ing: FeedBatchIngredientInput) => sum + Number(ing.quantityKg),
          0,
        );
        const totalQuantityTons = totalQuantityKg / 1000;

        const bagSizeKg = Number(updates.bagSizeKg ?? batch.bagSizeKg);
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
        await BatchIngredient.destroy({ where: { batchId }, transaction });
        const ingredientsWithBatchId = updates.ingredients.map(
          (ingredient: FeedBatchIngredientInput) => ({
            batchId,
            ingredientName: ingredient.ingredientName,
            quantityKg: ingredient.quantityKg,
            totalCost: ingredient.totalCost,
            costPerKg: Number(ingredient.totalCost) / Number(ingredient.quantityKg),
            supplier: ingredient.supplier || null,
          }),
        );
        await BatchIngredient.bulkCreate(ingredientsWithBatchId, { transaction });

        delete updates.ingredients;
      }

      await batch.update(updates as Partial<FeedBatchEntity>, { transaction });
      const updated = await FeedBatch.findByPk(batchId, {
        include: [
          {
            model: BatchIngredient,
            as: "ingredients",
          },
        ],
        transaction,
      });
      return updated;
    });
  },

  deleteFeedBatch: async (id: string | number | undefined) => {
    const batchId = ensureId(id, "Feed batch id");
    return withTransaction(async (transaction) => {
      const batch = await FeedBatch.findByPk(batchId, { transaction });
      if (!batch) throw new NotFoundError("Feed batch not found");

      await DailyLog.update(
        { feedBatchId: null },
        {
          where: { feedBatchId: batchId },
          transaction,
        },
      );

      await BatchIngredient.destroy({
        where: { batchId },
        transaction,
      });

      await batch.destroy({ transaction });
      return true;
    });
  },

  getBatchIngredients: async (batchId: string | number | undefined) => {
    const resolvedBatchId = ensureId(batchId, "Feed batch id");
    const ingredients = await BatchIngredient.findAll({
      where: { batchId: resolvedBatchId },
    });
    return ingredients;
  },

  addBatchIngredient: async (
    batchId: string | number | undefined,
    ingredientData: FeedBatchIngredientInput,
  ) => {
    const resolvedBatchId = ensureId(batchId, "Feed batch id");
    const sequelize = getSequelize();
    return sequelize.transaction(async (transaction) => {
      const batch = await FeedBatch.findByPk(resolvedBatchId, { transaction });
      if (!batch) throw new NotFoundError("Feed batch not found");

      const costPerKg =
        Number(ingredientData.totalCost) / Number(ingredientData.quantityKg);
      const ingredient = await BatchIngredient.create(
        {
          batchId: resolvedBatchId,
          ingredientName: ingredientData.ingredientName,
          quantityKg: ingredientData.quantityKg,
          totalCost: ingredientData.totalCost,
          costPerKg,
          supplier: ingredientData.supplier || null,
        },
        { transaction },
      );

      // Recalculate batch totals
      await feedBatchService.recalculateBatchTotals(resolvedBatchId, transaction);

      return ingredient;
    });
  },

  updateBatchIngredient: async (
    ingredientId: string | number | undefined,
    updates: Partial<BatchIngredientEntity>,
  ) => {
    const resolvedIngredientId = ensureId(ingredientId, "Ingredient id");
    const sequelize = getSequelize();
    return sequelize.transaction(async (transaction) => {
      const ingredient = asEntity<BatchIngredientEntity>(
        await BatchIngredient.findByPk(resolvedIngredientId, { transaction }),
      );
      if (!ingredient) throw new NotFoundError("Ingredient not found");

      if (updates.quantityKg && updates.totalCost) {
        updates.costPerKg = Number(updates.totalCost) / Number(updates.quantityKg);
      }

      await ingredient.update(updates, { transaction });

      // Recalculate batch totals
      await feedBatchService.recalculateBatchTotals(ingredient.batchId, transaction);

      return ingredient;
    });
  },

  removeBatchIngredient: async (ingredientId: string | number | undefined) => {
    const resolvedIngredientId = ensureId(ingredientId, "Ingredient id");
    const sequelize = getSequelize();
    return sequelize.transaction(async (transaction) => {
      const ingredient = asEntity<BatchIngredientEntity>(
        await BatchIngredient.findByPk(resolvedIngredientId, { transaction }),
      );
      if (!ingredient) throw new NotFoundError("Ingredient not found");

      const batchId = ingredient.batchId;
      await ingredient.destroy({ transaction });

      // Recalculate batch totals
      await feedBatchService.recalculateBatchTotals(batchId, transaction);

      return true;
    });
  },

  recalculateBatchTotals: async (
    batchId: string | number | undefined,
    transaction?: Transaction,
  ) => {
    const resolvedBatchId = ensureId(batchId, "Feed batch id");
    return withTransaction(async (activeTransaction) => {
      const batch = asEntity<FeedBatchEntity>(
        await FeedBatch.findByPk(resolvedBatchId, { transaction: activeTransaction }),
      );
      if (!batch) {
        throw new NotFoundError("Feed batch not found");
      }

      const ingredients = ((await BatchIngredient.findAll({
        where: { batchId: resolvedBatchId },
        transaction: activeTransaction,
      })) as unknown) as BatchIngredientEntity[];

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
      const bagSizeKg = Number(batch.bagSizeKg) || 50;

      const totalBags = Math.ceil(totalQuantityKg / bagSizeKg);
      const costPerBag = totalBags > 0 ? totalCost / totalBags : 0;
      const costPerKg = totalQuantityKg > 0 ? totalCost / totalQuantityKg : 0;

      await batch.update(
        {
          totalQuantityTons,
          totalBags,
          totalCost,
          costPerBag,
          costPerKg,
        },
        { transaction: activeTransaction },
      );

      return batch;
    }, transaction);
  },

  calculateBatchCost: async (
    ingredients: FeedBatchIngredientInput[],
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
        costPerKg: Number(ing.totalCost) / Number(ing.quantityKg),
      })),
    };
  },
};

export default feedBatchService;
