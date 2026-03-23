import type {
  BatchUsageStats,
  FeedBatch,
  FeedBatchPayload,
  FeedRecipe,
  FeedRecipePayload,
  Ingredient,
} from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

export async function getFeedRecipes(): Promise<FeedRecipe[]> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes`);
  const data = await handleResponse<{ data?: FeedRecipe[] }>(res);
  return data?.data || [];
}

export async function createFeedRecipe(
  payload: FeedRecipePayload,
): Promise<FeedRecipe> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedRecipe }>(res);
  return data?.data as FeedRecipe;
}

export async function updateFeedRecipe(
  id: number | string,
  payload: Partial<FeedRecipePayload>,
): Promise<FeedRecipe> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedRecipe }>(res);
  return data?.data as FeedRecipe;
}

export async function deleteFeedRecipe(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function getFeedBatches(
  filters: Record<string, string> = {},
): Promise<FeedBatch[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/feed/batches?${params}`);
  const data = await handleResponse<{ data?: FeedBatch[] }>(res);
  return data?.data || [];
}

export async function createFeedBatch(
  payload: FeedBatchPayload,
): Promise<FeedBatch> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedBatch }>(res);
  return data?.data as FeedBatch;
}

export async function updateFeedBatch(
  id: number | string,
  payload: Partial<FeedBatchPayload>,
): Promise<FeedBatch> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedBatch }>(res);
  return data?.data as FeedBatch;
}

export async function deleteFeedBatch(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function getBatchIngredients(
  batchId: number | string,
): Promise<Ingredient[]> {
  const res = await fetchWithAuth(
    `${BASE}/api/feed/batches/${batchId}/ingredients`,
  );
  const data = await handleResponse<{ data?: Ingredient[] }>(res);
  return data?.data || [];
}

export async function addBatchIngredient(
  batchId: number | string,
  payload: Partial<Ingredient>,
): Promise<Ingredient> {
  const res = await fetchWithAuth(
    `${BASE}/api/feed/batches/${batchId}/ingredients`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = await handleResponse<{ data?: Ingredient }>(res);
  return data?.data as Ingredient;
}

export async function estimateBatchCost(payload: {
  ingredients: Ingredient[];
}) {
  const res = await fetchWithAuth(`${BASE}/api/feed/estimate-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function calculateFeedBatchCost(
  payload: Partial<FeedBatchPayload>,
) {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/calculate-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getFeedBatchUsageStats(): Promise<BatchUsageStats[]> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches-usage`);
  const data = await handleResponse<{ data?: BatchUsageStats[] }>(res);
  return data?.data || [];
}

export async function getFeedBatchUsageById(
  id: number | string,
): Promise<BatchUsageStats | null> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}/usage`);
  const data = await handleResponse<{ data?: BatchUsageStats }>(res);
  return data?.data || null;
}
