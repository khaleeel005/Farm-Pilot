export function shouldRunCliMigrations(): boolean {
  if (process.env.NODE_ENV === "production") {
    return process.env.SKIP_DB_MIGRATIONS !== "true";
  }

  return process.env.USE_MIGRATIONS === "true";
}
