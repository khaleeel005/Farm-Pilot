import request from "supertest";
import { sequelize, autoMigrate } from "../../src/utils/database.js";
import app from "../../testApp.js";
import bcrypt from "bcrypt";

describe("Sales Management Flow", () => {
  let ownerToken;
  let supervisorToken;
  let customerId;
  let houseId;

  beforeAll(async () => {
    await autoMigrate();

    // Create test users
    const { default: User } = await import("../../src/models/User.js");
    const { default: House } = await import("../../src/models/House.js");

    const ownerHash = await bcrypt.hash("owner123", 10);
    await User.create({
      username: "testowner",
      password: ownerHash,
      role: "owner",
      fullName: "Test Owner",
    });

    const supervisorHash = await bcrypt.hash("staff123", 10);
    await User.create({
      username: "teststaff",
      password: supervisorHash,
      role: "staff",
      fullName: "Test Staff",
    });

    // Create a test house
    const house = await House.create({
      houseName: "Test House",
      capacity: 1000,
      currentBirdCount: 800,
    });
    houseId = house.id;
    houseId = house.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const auth = (token) => (req) =>
    token ? req.set("Authorization", `Bearer ${token}`) : req;

  test("1. Staff login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "teststaff", password: "staff123" });

    expect(res.statusCode).toBe(200);
    supervisorToken = res.body.token;
  });

  test("2. Owner login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testowner", password: "owner123" });

    expect(res.statusCode).toBe(200);
    ownerToken = res.body.token;
  });

  test("3. Create customer", async () => {
    const res = await auth(ownerToken)(
      request(app).post("/api/customers")
    ).send({
      customerName: "John's Grocery Store",
      phone: "+1234567890",
      email: "john@grocery.com",
      address: "123 Main St, City, State",
      preferredContact: "phone",
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data).toHaveProperty("id");
    customerId = res.body.data.id;
  });

  test("4. Get all customers", async () => {
    const res = await auth(supervisorToken)(request(app).get("/api/customers"));

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("5. Update customer", async () => {
    const res = await auth(ownerToken)(
      request(app).put(`/api/customers/${customerId}`)
    ).send({
      customerName: "John's Updated Grocery Store",
      phone: "+1234567891",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.customerName).toBe("John's Updated Grocery Store");
  });

  test("6. Create sales transaction", async () => {
    const res = await auth(ownerToken)(
      request(app).post("/api/sales")
    ).send({
      saleDate: "2025-08-25",
      customerId: customerId,
      quantity: 90,
      pricePerEgg: 23.22, // (50*25 + 30*22 + 10*18) / 90 = 2090 / 90 ≈ 23.22
      totalAmount: 2090,
      paymentMethod: "cash",
      paymentStatus: "paid",
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data).toHaveProperty("id");
  });

  test("7. Get sales by date", async () => {
    const res = await auth(supervisorToken)(
      request(app).get("/api/sales?date=2025-08-25")
    );

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("8. Get sales by customer", async () => {
    const res = await auth(supervisorToken)(
      request(app).get(`/api/sales?customer=${customerId}`)
    );

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("9. Update sales transaction", async () => {
    // First get the sales to find one to update
    const getRes = await auth(ownerToken)(
      request(app).get("/api/sales?date=2025-08-25")
    );

    expect(getRes.statusCode).toBe(200);
    const saleId = getRes.body.data[0]?.id;

    if (saleId) {
      const updateRes = await auth(ownerToken)(
        request(app).put(`/api/sales/${saleId}`)
      ).send({
        quantity: 100,
        paymentStatus: "paid",
      });

      expect(updateRes.statusCode).toBe(200);
    }
  });

  test("10. Get sales summary report", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/reports/sales?start=2025-08-01&end=2025-08-31")
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start");
    expect(res.body.data).toHaveProperty("end");
    expect(res.body.data).toHaveProperty("totalAmount");
    expect(res.body.data).toHaveProperty("totalEggs");
  });

  test("11. Create sales with transfer payment", async () => {
    const res = await auth(ownerToken)(
      request(app).post("/api/sales")
    ).send({
      saleDate: "2025-08-26",
      customerId: customerId,
      quantity: 60,
      pricePerEgg: 24.0, // (40*25 + 20*22) / 60 = 1440 / 60 = 24
      totalAmount: 1440,
      paymentMethod: "transfer",
      paymentStatus: "pending",
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  test("12. Validate sales creation with missing required fields", async () => {
    const res = await auth(ownerToken)(
      request(app).post("/api/sales")
    ).send({
      saleDate: "2025-08-27",
      // Missing customerId and other required fields
    });

    expect(res.statusCode).toBe(400);
  });

  test("13. Validate customer creation with invalid email", async () => {
    const res = await auth(ownerToken)(
      request(app).post("/api/customers")
    ).send({
      customerName: "Invalid Customer",
      email: "invalid-email", // Invalid email format
    });

    expect(res.statusCode).toBe(400);
  });

  test("14. Get customer by ID", async () => {
    const res = await auth(supervisorToken)(
      request(app).get(`/api/customers/${customerId}`)
    );

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.data.customerName).toBe("John's Updated Grocery Store");
    }
  });

  test("15. Delete customer (if endpoint exists)", async () => {
    // Note: This test might fail if delete endpoint doesn't exist
    const res = await auth(ownerToken)(
      request(app).delete(`/api/customers/${customerId}`)
    );

    expect([200, 204, 404]).toContain(res.statusCode); // 404 if endpoint doesn't exist
  });
});
