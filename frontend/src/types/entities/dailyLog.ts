import { House } from './house';

/**
 * DailyLog - Matches backend DailyLog model exactly
 */
export interface DailyLog {
  id: number;
  logDate: string;
  houseId: number;
  eggsCollected: number;
  crackedEggs: number;
  feedBatchId: number | null;
  feedBagsUsed: number;
  mortalityCount: number;
  notes: string | null;
  supervisorId: number | null;
  createdAt?: string;
  updatedAt?: string;
  // Included associations
  House?: House;
  FeedBatch?: FeedBatch;
}

/**
 * FeedBatch reference for DailyLog
 */
interface FeedBatch {
  id: number;
  batchName: string;
  costPerBag: number;
  bagSizeKg: number;
  totalBags: number;
}

/**
 * Payload for creating/updating daily logs
 */
export interface DailyLogPayload {
  logDate: string;
  houseId: number;
  eggsCollected?: number;
  crackedEggs?: number;
  feedBatchId?: number | null;
  feedBagsUsed?: number;
  mortalityCount?: number;
  notes?: string;
  supervisorId?: number;
}

/**
 * Summary of today's production
 */
export interface TodaySummary {
  totalEggs: number;
  housesLogged: number;
  totalHouses: number;
  houseBreakdown: Array<{
    houseId: number;
    houseName: string;
    eggs: number;
  }>;
}
