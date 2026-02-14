export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function assertRequiredFields<T extends Record<string, unknown>>(
  payload: T,
  requiredFields: (keyof T)[],
): string[] {
  return requiredFields
    .filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === "")
    .map((field) => String(field));
}
