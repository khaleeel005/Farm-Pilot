export interface BirdBatch {
  id: number;
  houseId: number;
  batchName: string;
  placedAt: string;
  initialBirdCount: number;
  currentBirdCount: number;
  mortalityCount: number;
  status: "active" | "completed";
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BirdBatchPayload {
  batchName: string;
  placedAt: string;
  initialBirdCount: number;
  notes?: string;
}
