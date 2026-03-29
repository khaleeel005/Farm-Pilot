import { API_BASE_URL, fetchWithAuth, handleResponse } from "@/lib/apiClient";

export interface DailyFlowRow {
  date: string;
  collected: number;
  cracked: number;
  soldEggs: number;
  soldCrates: number;
  adjusted: number;
  net: number;
}

export interface EggInventorySummary {
  period: { start: string; end: string };
  eggsPerCrate: number;
  openingBalance: number;
  totalCollected: number;
  totalCracked: number;
  totalSoldEggs: number;
  totalSoldCrates: number;
  totalAdjustments: number;
  netStock: number;
  netStockCrates: number;
  netStockPieces: number;
  dailyFlow: DailyFlowRow[];
}

export interface EggAdjustmentPayload {
  date: string;
  quantity: number; // positive for add, negative for deduct
  reason?: string;
}

export async function fetchEggInventory(
  startDate: string,
  endDate: string,
): Promise<EggInventorySummary> {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetchWithAuth(`${API_BASE_URL}/api/inventory/eggs?${params.toString()}`);
  const data = await handleResponse<{ data: EggInventorySummary }>(res);
  return data.data;
}

export async function createEggAdjustment(payload: EggAdjustmentPayload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/inventory/eggs/adjustments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
