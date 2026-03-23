import type { FeedBatchPayload, Ingredient } from "@/types";

export interface IngredientInput {
  ingredientName: string;
  quantityKg: number;
  totalCost: number;
  supplier: string;
}

export interface FeedBatchFormData {
  batchName: string;
  batchDate: string;
  bagSizeKg: number;
  miscellaneousCost: number;
  ingredients: IngredientInput[];
}

export interface FeedCostEstimate {
  totalQuantityTons?: number;
  totalQuantityKg?: number;
  totalBags?: number;
  bagSizeKg?: number;
  totalCost?: number;
  ingredientsCost?: number;
  miscellaneousCost?: number;
  costPerBag?: number;
  costPerKg?: number;
}

export interface FeedBatchDeleteConfirm {
  batchId?: number;
  batchName?: string;
  show: boolean;
}

export function createEmptyIngredientInput(): IngredientInput {
  return {
    ingredientName: "",
    quantityKg: 0,
    totalCost: 0,
    supplier: "",
  };
}

export function createEmptyFeedBatchForm(): FeedBatchFormData {
  return {
    batchName: "",
    batchDate: new Date().toISOString().split("T")[0],
    bagSizeKg: 50,
    miscellaneousCost: 0,
    ingredients: [createEmptyIngredientInput()],
  };
}

export function getValidIngredients(ingredients: IngredientInput[]) {
  return ingredients.filter(
    (ingredient) =>
      ingredient.ingredientName && ingredient.quantityKg > 0 && ingredient.totalCost > 0,
  );
}

export function buildFeedIngredients(
  ingredients: IngredientInput[],
): Ingredient[] {
  return getValidIngredients(ingredients).map((ingredient) => ({
    ...ingredient,
    costPerKg:
      ingredient.quantityKg > 0
        ? ingredient.totalCost / ingredient.quantityKg
        : 0,
  }));
}

export function buildFeedBatchPayload(
  formData: FeedBatchFormData,
): FeedBatchPayload {
  return {
    batchDate: formData.batchDate,
    batchName: formData.batchName,
    bagSizeKg: formData.bagSizeKg,
    miscellaneousCost: formData.miscellaneousCost,
    ingredients: buildFeedIngredients(formData.ingredients),
  };
}

export function validateFeedBatchForm(formData: FeedBatchFormData) {
  const errors: string[] = [];

  if (!formData.batchName.trim()) {
    errors.push("Batch name is required");
  }

  if (getValidIngredients(formData.ingredients).length === 0) {
    errors.push("At least one valid ingredient is required");
  }

  return errors;
}

export function extractFeedCostEstimate(
  response: Record<string, unknown>,
): FeedCostEstimate | null {
  return (response.data as FeedCostEstimate) || (response as FeedCostEstimate);
}

export function formatFeedCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getUsageBarClassName(usagePercentage: number): string {
  if (usagePercentage > 90) {
    return "bg-red-500";
  }

  if (usagePercentage > 70) {
    return "bg-yellow-500";
  }

  return "bg-green-500";
}
