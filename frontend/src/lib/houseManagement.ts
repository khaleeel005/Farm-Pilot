import { HouseStatus } from "@/types";
import type { House, HousePayload } from "@/types";

const HOUSE_STORAGE_KEY = "farm-pilot-houses";

export interface HouseFormData {
  name: string;
  capacity: string;
  currentBirdCount: string;
  location: string;
  status: House["status"];
  description: string;
}

export interface HouseMetrics {
  totalHouses: number;
  activeHouses: number;
  totalCapacity: number;
  totalBirds: number;
  capacityUsage: number;
}

export function createEmptyHouseForm(): HouseFormData {
  return {
    name: "",
    capacity: "",
    currentBirdCount: "",
    location: "",
    status: HouseStatus.ACTIVE,
    description: "",
  };
}

export function createHouseFormData(house: House): HouseFormData {
  return {
    name: house.houseName,
    capacity: String(house.capacity),
    currentBirdCount: String(house.currentBirdCount),
    location: house.location || "",
    status: house.status,
    description: house.description || "",
  };
}

export function buildHousePayload(formData: HouseFormData): HousePayload {
  return {
    houseName: formData.name.trim(),
    capacity: Number.parseInt(formData.capacity, 10),
    currentBirdCount: Number.parseInt(formData.currentBirdCount, 10),
    location: formData.location.trim() || undefined,
    status: formData.status,
    description: formData.description.trim() || undefined,
  };
}

export function calculateHouseMetrics(houses: House[]): HouseMetrics {
  const totalCapacity = houses.reduce((sum, house) => sum + house.capacity, 0);
  const totalBirds = houses.reduce(
    (sum, house) => sum + house.currentBirdCount,
    0,
  );

  return {
    totalHouses: houses.length,
    activeHouses: houses.filter((house) => house.status === HouseStatus.ACTIVE)
      .length,
    totalCapacity,
    totalBirds,
    capacityUsage: totalCapacity > 0 ? (totalBirds / totalCapacity) * 100 : 0,
  };
}

export function getHouseStatusColor(status: House["status"]) {
  switch (status) {
    case HouseStatus.ACTIVE:
      return "border-transparent bg-success text-success-foreground";
    case HouseStatus.MAINTENANCE:
      return "border-transparent bg-warning text-warning-foreground";
    case HouseStatus.INACTIVE:
      return "border-transparent bg-destructive text-destructive-foreground";
    default:
      return "text-foreground";
  }
}

export function getHouseOccupancy(house: House) {
  if (house.capacity <= 0) {
    return 0;
  }

  return (house.currentBirdCount / house.capacity) * 100;
}

export function readCachedHouses(): House[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(HOUSE_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function writeCachedHouses(houses: House[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HOUSE_STORAGE_KEY, JSON.stringify(houses));
  } catch {
    // Ignore storage failures and keep the UI responsive.
  }
}
