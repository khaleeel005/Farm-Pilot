describe("shouldRunCliMigrations", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalUseMigrations = process.env.USE_MIGRATIONS;
  const originalSkipDbMigrations = process.env.SKIP_DB_MIGRATIONS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.USE_MIGRATIONS = originalUseMigrations;
    process.env.SKIP_DB_MIGRATIONS = originalSkipDbMigrations;
  });

  test("defaults to running migrations in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.SKIP_DB_MIGRATIONS;

    const { shouldRunCliMigrations } = await import("../../../dist/utils/migrationPolicy.js");

    expect(shouldRunCliMigrations()).toBe(true);
  });

  test("allows production migrations to be disabled explicitly", async () => {
    process.env.NODE_ENV = "production";
    process.env.SKIP_DB_MIGRATIONS = "true";

    const { shouldRunCliMigrations } = await import("../../../dist/utils/migrationPolicy.js");

    expect(shouldRunCliMigrations()).toBe(false);
  });

  test("still requires USE_MIGRATIONS outside production", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.SKIP_DB_MIGRATIONS;
    process.env.USE_MIGRATIONS = "false";

    const { shouldRunCliMigrations } = await import("../../../dist/utils/migrationPolicy.js");

    expect(shouldRunCliMigrations()).toBe(false);

    process.env.USE_MIGRATIONS = "true";

    expect(shouldRunCliMigrations()).toBe(true);
  });
});
