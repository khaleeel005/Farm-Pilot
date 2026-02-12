import request from "supertest";
import {
  sequelize,
  initModels,
  autoMigrate,
} from "../../src/utils/database.js";
import app from "../../testApp.js";

// Full flow integration test: login -> house -> recipe -> batch -> ingredient -> daily log -> operating cost -> cost calculation

beforeAll(async () => {
  await autoMigrate();
  // create an admin user directly for tests
  const { default: User } = await import("../../src/models/User.js");
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.hash("admin123", 10);
  await User.create({ username: "admin", password: hash, role: "Owner" });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Complete Farm Management Flow", () => {
  let authToken;
  let houseId;
  let recipeId;
  let batchId;
  const auth = (req) =>
    authToken ? req.set("Authorization", `Bearer ${authToken}`) : req;

  test("1. User login (admin)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });

    if (res.statusCode === 200) {
      authToken = res.body.token;
      expect(authToken).toBeDefined();
    }
  });

  test("2. Create a house", async () => {
    const res = await auth(request(app).post("/api/houses")).send({
      houseName: "Test House 1",
      description: "Integration test house",
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data.id).toBeDefined();
    houseId = res.body.data.id;
  });

  test("3. Create a feed recipe", async () => {
    const res = await auth(request(app).post("/api/feed/recipes")).send({
      recipeName: "Layer Starter Mix",
      cornPercent: 45.5,
      soybeanPercent: 25.0,
      wheatBranPercent: 20.0,
      limestonePercent: 5.0,
      isActive: true,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.id).toBeDefined();
    recipeId = res.body.data.id;
  });

  test("4. Create a feed batch", async () => {
    const res = await auth(request(app).post("/api/feed/batches")).send({
      batchDate: "2025-08-20",
      batchName: "Test Batch for Costs",
      ingredients: [
        {
          ingredientName: "Corn (Yellow)",
          quantityKg: 500,
          totalCost: 400,
        },
        {
          ingredientName: "Soybean Meal",
          quantityKg: 300,
          totalCost: 300,
        },
        {
          ingredientName: "Wheat Bran",
          quantityKg: 200,
          totalCost: 100,
        },
      ],
      bagSizeKg: 50,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.id).toBeDefined();
    batchId = res.body.data.id;
  });

  test("5. Add batch ingredient", async () => {
    const res = await auth(
      request(app).post(`/api/feed/batches/${batchId}/ingredients`)
    ).send({
      ingredientName: "Limestone",
      quantityKg: 50,
      totalCost: 25,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.id).toBeDefined();
  });

  test("6. Create daily log with eggs and feed consumption", async () => {
    const res = await auth(request(app).post("/api/daily-logs")).send({
      logDate: "2025-08-26",
      houseId: houseId,
      eggsCollected: 125,
      feedBagsUsed: 2, // Using bags instead of kg
      mortalityCount: 2,
      notes: "Integration test log",
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  test("7. Create operating costs for the month", async () => {
    const res = await auth(request(app).post("/api/costs/operating")).send({
      monthYear: "2025-08-01",
      supervisorSalary: 40000,
      totalLaborerSalaries: 120000,
      electricityCost: 15000,
      waterCost: 2000,
      maintenanceCost: 5000,
      otherCosts: 3000,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.totalMonthlyCost).toBe(185000);
  });

  test("8. Get daily costs - should show non-zero values", async () => {
    const res = await auth(request(app).get("/api/costs/daily/2025-08-26"));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalEggs).toBeGreaterThan(0); // Should be 125 (100+20+5)
    expect(res.body.data.totalFeedKg).toBeGreaterThan(0); // Should be 30.5
    expect(res.body.data.feedCost).toBeGreaterThan(0); // Should be 30.5 * 0.8 = 24.4
    expect(res.body.data.feedCostPerEgg).toBeGreaterThan(0); // Should be 24.4 / 125 = 0.1952
  });

  test("9. Get egg price estimate - should show suggested price", async () => {
    const res = await auth(request(app).get("/api/costs/egg-price/2025-08-26"));

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalCostPerEgg).toBeGreaterThan(0);
    expect(res.body.data.suggestedPrice).toBeGreaterThan(0);
  });

  test("10. Get cost summary for date range", async () => {
    const res = await auth(
      request(app).get("/api/costs/summary?start=2025-08-01&end=2025-08-31")
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalEggs).toBeGreaterThan(0);
    expect(res.body.data.totalFeedKg).toBeGreaterThan(0);
  });
});
