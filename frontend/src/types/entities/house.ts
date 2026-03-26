import { HouseStatus } from '../enums';

/**
 * House - Matches backend House model exactly
 */
export interface House {
  id: number;
  houseName: string;
  capacity: number;
  initialBirdCount: number;
  currentBirdCount: number;
  mortalityCount: number;
  location: string | null;
  description: string | null;
  status: HouseStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload for creating/updating houses
 */
export interface HousePayload {
  houseName?: string;
  capacity?: number;
  initialBirdCount?: number;
  currentBirdCount?: number;
  mortalityCount?: number;
  location?: string;
  description?: string;
  status?: HouseStatus | string;
}
