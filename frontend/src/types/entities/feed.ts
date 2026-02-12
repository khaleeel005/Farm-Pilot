/**
 * Ingredient - Matches backend BatchIngredient model
 */
export interface Ingredient {
  id?: number;
  batchId?: number;
  ingredientName: string;
  quantityKg: number;
  totalCost: number;
  costPerKg: number;
  supplier?: string | null;
}

/**
 * FeedBatch - Matches backend FeedBatch model exactly
 */
export interface FeedBatch {
  id: number;
  batchDate: string;
  batchName: string;
  totalQuantityTons: number;
  bagSizeKg: number;
  totalBags: number;
  totalCost: number;
  costPerBag: number;
  costPerKg: number;
  miscellaneousCost: number;
  createdAt?: string;
  updatedAt?: string;
  // Included associations
  ingredients?: Ingredient[];
}

/**
 * FeedRecipe - Matches backend FeedRecipe model exactly
 */
export interface FeedRecipe {
  id: number;
  recipeName: string;
  cornPercent: number;
  soybeanPercent: number;
  wheatBranPercent: number;
  limestonePercent: number;
  otherIngredients: Record<string, unknown> | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for creating/updating feed batches
 */
export interface FeedBatchPayload {
  batchDate: string;
  batchName: string;
  bagSizeKg?: number;
  miscellaneousCost?: number;
  ingredients: Ingredient[];
}

/**
 * Payload for creating/updating feed recipes
 */
export interface FeedRecipePayload {
  recipeName: string;
  cornPercent: number;
  soybeanPercent: number;
  wheatBranPercent: number;
  limestonePercent: number;
  otherIngredients?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * BatchUsageStats - Usage statistics for a feed batch
 */
export interface BatchUsageStats {
  batchId: number;
  batchName: string;
  totalBags: number;
  bagsUsed: number;
  remainingBags: number;
  usagePercentage: number;
  isNearlyEmpty: boolean;
  isEmpty: boolean;
  costPerBag: number;
  bagSizeKg: number;
}
