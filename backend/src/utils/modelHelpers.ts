import type { Model } from "sequelize";

export type ModelEntity<T extends object> = Model & T;

export function asEntity<T extends object>(
  value: Model | null,
): ModelEntity<T> | null {
  return value as ModelEntity<T> | null;
}

export function asEntities<T extends object>(
  values: Model[],
): ModelEntity<T>[] {
  return values as ModelEntity<T>[];
}
