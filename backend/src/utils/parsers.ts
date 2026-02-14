import type { QueryValue } from "../types/common.js";

export function queryString(value: QueryValue): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

export function queryInt(value: QueryValue): number | undefined {
  const parsed = queryString(value);
  if (!parsed) return undefined;

  const intValue = Number.parseInt(parsed, 10);
  return Number.isNaN(intValue) ? undefined : intValue;
}

export function queryFloat(value: QueryValue): number | undefined {
  const parsed = queryString(value);
  if (!parsed) return undefined;

  const floatValue = Number.parseFloat(parsed);
  return Number.isNaN(floatValue) ? undefined : floatValue;
}
