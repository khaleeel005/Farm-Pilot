export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type NumericLike = number | string;

export type QueryValue = unknown;

export type JsonObject = Record<string, unknown>;

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface DateRangeInput {
  startDate?: string;
  endDate?: string;
}

export type IdParam = {
  id: string;
};
