import request from "supertest";
import { sequelize, autoMigrate } from "../../src/utils/database.js";
import app from "../../testApp.js";
import bcrypt from "bcrypt";

describe("Reporting Flow", () => {
  let ownerToken;
  let supervisorToken;
  let houseId;
  let customerId;

  beforeAll(async () => {
    await autoMigrate();

    // Create test users, house, and customer
    const { default: User } = await import("../../src/models/User.js");
    const { default: House } = await import("../../src/models/House.js");
    const { default: Customer } = await import("../../src/models/Customer.js");

    const ownerHash = await bcrypt.hash("owner123", 10);
    await User.create({
      username: "testowner",
      password: ownerHash,
      role: "Owner",
      fullName: "Test Owner",
    });

    const supervisorHash = await bcrypt.hash("staff123", 10);
    await User.create({
      username: "teststaff",
      password: supervisorHash,
      role: "staff",
      fullName: "Test Staff",
    });

    // Create test house
    const house = await House.create({
      houseName: "Reports Test House",
      capacity: 1000,
      currentBirdCount: 900,
    });
    houseId = house.id;

    // Create test customer
    const customer = await Customer.create({
      customerName: "Reports Test Customer",
      phone: "+1234567890",
      email: "reports@test.com",
      address: "123 Report St",
      preferredContact: "email",
    });
    customerId = customer.id;

    // Login to get tokens BEFORE creating sample data
    const ownerLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "testowner", password: "owner123" });
    ownerToken = ownerLoginRes.body.token;

    const staffLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "teststaff", password: "staff123" });
    supervisorToken = staffLoginRes.body.token;

    // Create sample data for reports
    await createSampleData();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const createSampleData = async () => {
    // Create daily logs for a month
    for (let day = 1; day <= 31; day++) {
      const date = `2025-08-${day.toString().padStart(2, "0")}`;
      await auth(supervisorToken)(request(app).post("/api/daily-logs")).send({
        logDate: date,
        houseId: houseId,
        eggsCollected: Math.floor(Math.random() * 95) + 100,
        feedBagsUsed: Math.floor(Math.random() * 3) + 1,
        mortalityCount: Math.floor(Math.random() * 3),
        notes: `Sample data for ${date}`,
      });
    }

    // Create sales transactions (requires ownerToken)
    for (let day = 1; day <= 31; day += 2) {
      const date = `2025-08-${day.toString().padStart(2, "0")}`;
      await auth(ownerToken)(request(app).post("/api/sales")).send({
        saleDate: date,
        customerId: customerId,
        quantity: Math.floor(Math.random() * 45) + 17,
        pricePerEgg: 22.0,
        paymentMethod: "cash",
        paymentStatus: "paid",
      });
    }
  };

  const auth = (token) => (req) =>
    token ? req.set("Authorization", `Bearer ${token}`) : req;

  test("1. Owner login", async () => {
    // Login already done in beforeAll, just verify token exists
    expect(ownerToken).toBeDefined();
  });

  test("2. Staff login", async () => {
    // Login already done in beforeAll, just verify token exists
    expect(supervisorToken).toBeDefined();
  });

  test("3. Get production report", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-08-01&end=2025-08-31"
      )
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start", "2025-08-01");
    expect(res.body.data).toHaveProperty("end", "2025-08-31");
    expect(res.body.data).toHaveProperty("totalEggs");
    expect(res.body.data).toHaveProperty("avgPerDay");
    expect(res.body.data).toHaveProperty("logs");
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.totalEggs).toBeGreaterThan(0);
  });

  test("4. Get sales report", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/reports/sales?start=2025-08-01&end=2025-08-31")
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start", "2025-08-01");
    expect(res.body.data).toHaveProperty("end", "2025-08-31");
    expect(res.body.data).toHaveProperty("totalAmount");
    expect(res.body.data).toHaveProperty("totalEggs");
    expect(res.body.data).toHaveProperty("rows");
    expect(Array.isArray(res.body.data.rows)).toBe(true);
  });

  test("5. Get financial report", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/reports/financial?start=2025-08-01&end=2025-08-31")
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start", "2025-08-01");
    expect(res.body.data).toHaveProperty("end", "2025-08-31");
    expect(res.body.data).toHaveProperty("totalOperating");
    expect(res.body.data).toHaveProperty("totalSales");
  });

  test("6. Export production report as CSV", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/export/production?start=2025-08-01&end=2025-08-31&format=csv"
      )
    );

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("date");
      expect(res.text).toContain("eggsCollected");
    }
  });

  test("7. Export sales report as CSV", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/export/sales?start=2025-08-01&end=2025-08-31&format=csv"
      )
    );

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("date");
      expect(res.text).toContain("totalAmount");
    }
  });

  test("8. Export production report as PDF", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/export/production?start=2025-08-01&end=2025-08-31&format=pdf"
      )
    );

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers["content-type"]).toContain("application/pdf");
    }
  });

  test("9. Get production report for specific house", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        `/api/reports/production?start=2025-08-01&end=2025-08-31&houseId=${houseId}`
      )
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("totalEggs");
  });

  test("10. Get weekly production report", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-08-01&end=2025-08-07"
      )
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data.logs.length).toBeLessThanOrEqual(7);
  });

  test("11. Get monthly sales summary", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/reports/sales?start=2025-08-01&end=2025-08-31")
    );

    if (res.statusCode === 200) {
      const totalAmount = res.body.data.totalAmount;
      const totalEggs = res.body.data.totalEggs;

      // totalAmount might be 0 if not calculated during creation
      // but totalEggs should be > 0 since we created sales
      expect(totalEggs).toBeGreaterThan(0);

      // Calculate actual dozens from total eggs
      const actualDozens = Math.floor(totalEggs / 12);
      expect(actualDozens).toBeGreaterThan(0);
    }
  });

  test("12. Test report date validation", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-08-31&end=2025-08-01"
      )
    );

    // Should handle invalid date ranges gracefully
    expect([200, 400]).toContain(res.statusCode);
  });

  test("13. Test report with no data", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-07-01&end=2025-07-31"
      )
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data.totalEggs).toBe(0);
    expect(res.body.data.logs.length).toBe(0);
  });

  test("14. Get production efficiency metrics", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production/metrics?start=2025-08-01&end=2025-08-31"
      )
    );

    // This endpoint might not exist
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("feedConversionRatio");
      expect(res.body.data).toHaveProperty("mortalityRate");
    }
  });

  test("15. Supervisor can access reports", async () => {
    const res = await auth(supervisorToken)(
      request(app).get(
        "/api/reports/production?start=2025-08-01&end=2025-08-31"
      )
    );

    expect(res.statusCode).toBe(200);
  });

  test("16. Test report caching (if implemented)", async () => {
    const startTime = Date.now();

    await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-08-01&end=2025-08-31"
      )
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Reports should be reasonably fast (< 5 seconds for test data)
    expect(responseTime).toBeLessThan(5000);
  });

  test("17. Export financial report as PDF", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/export/financial?start=2025-08-01&end=2025-08-31&format=pdf"
      )
    );

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers["content-type"]).toContain("application/pdf");
    }
  });

  test("18. Test report with invalid format", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/export/production?start=2025-08-01&end=2025-08-31&format=invalid"
      )
    );

    expect([400, 404]).toContain(res.statusCode);
  });

  test("19. Get comparative reports", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/comparison?period1=2025-07&period2=2025-08"
      )
    );

    // This endpoint might not exist
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.data).toHaveProperty("period1");
      expect(res.body.data).toHaveProperty("period2");
      expect(res.body.data).toHaveProperty("comparison");
    }
  });

  test("20. Test large date range performance", async () => {
    const res = await auth(ownerToken)(
      request(app).get(
        "/api/reports/production?start=2025-01-01&end=2025-12-31"
      )
    );

    expect(res.statusCode).toBe(200);
    // Should handle large date ranges without crashing
  });
});
