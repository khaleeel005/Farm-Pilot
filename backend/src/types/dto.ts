import type {
  CostEntryEntity,
  CostType,
  FeedBatchEntity,
  FeedRecipeEntity,
  SalesEntity,
} from "./entities.js";
import type { NumericLike, PaginationInput } from "./common.js";

export interface AuthLoginInput {
  username: string;
  password: string;
}

export interface AuthPublicUser {
  id: number;
  username: string;
  role: string;
  email?: string | null;
  createdAt?: Date;
}

export interface CostEntryFiltersInput {
  startDate?: string;
  endDate?: string;
  costType?: CostType;
  category?: CostEntryEntity["category"];
  houseId?: number;
  createdBy?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface CostEntryPaginationInput extends PaginationInput {}

export interface CostSummaryFiltersInput {
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month" | "year";
  houseId?: number;
}

export interface CustomerFiltersInput {
  isActive?: string;
}

export interface DailyLogFiltersInput {
  date?: string;
  logDate?: string;
  houseId?: number | string;
}

export interface FeedBatchIngredientInput {
  ingredientName: string;
  quantityKg: NumericLike;
  totalCost: NumericLike;
  supplier?: string | null;
}

export interface FeedBatchCreateInput {
  batchDate: string;
  batchName: string;
  ingredients: FeedBatchIngredientInput[];
  bagSizeKg?: NumericLike;
  miscellaneousCost?: NumericLike;
}

export interface FeedBatchFiltersInput {
  date?: string;
  batchDate?: string;
  batchName?: string;
}

export interface FeedBatchUpdateInput extends Partial<FeedBatchEntity> {
  ingredients?: FeedBatchIngredientInput[];
}

export interface FeedRecipeFiltersInput {
  isActive?: string;
}

export interface FeedRecipeUpdateInput extends Partial<FeedRecipeEntity> {}

export interface LaborAssignmentFiltersInput {
  date?: string;
  laborer?: string | number;
}

export interface SalesFiltersInput {
  date?: string;
  saleDate?: string;
  customer?: string | number;
  customerId?: string | number;
}

export interface SalesUpdateInput extends Partial<SalesEntity> {}

export interface StaffCreateInput {
  username: string;
  password: string;
}

export interface StaffUpdateInput {
  fullName?: string;
  username?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export type ReportType = "production" | "sales" | "financial";
export type ReportFormat = "csv" | "pdf";
