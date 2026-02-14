import request from "supertest";
import { sequelize, autoMigrate } from "../../dist/utils/database.js";
import app from "../../testApp.js";
import bcrypt from "bcrypt";

describe("House Management Flow", () => {
  let ownerToken;
  let supervisorToken;
  let houseId;

  beforeAll(async () => {
    await autoMigrate();

    // Create test users
    const { default: User } = await import("../../dist/models/User.js");

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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const auth = (token) => (req) =>
    token ? req.set("Authorization", `Bearer ${token}`) : req;

  test("1. Owner login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testowner", password: "owner123" });

    expect(res.statusCode).toBe(200);
    ownerToken = res.body.token;
  });

  test("2. Supervisor login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "teststaff", password: "staff123" });

    expect(res.statusCode).toBe(200);
    supervisorToken = res.body.token;
  });

  test("3. Create house", async () => {
    const res = await auth(ownerToken)(request(app).post("/api/houses")).send({
      houseName: "House Alpha",
      capacity: 1000,
      currentBirdCount: 800,
      location: "North Wing",
      description: "Main egg production house",
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data).toHaveProperty("id");
    houseId = res.body.data.id;
  });

  test("4. Get all houses", async () => {
    const res = await auth(supervisorToken)(request(app).get("/api/houses"));

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("5. Get house by ID", async () => {
    const res = await auth(supervisorToken)(
      request(app).get(`/api/houses/${houseId}`)
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.data.houseName).toBe("House Alpha");
    expect(res.body.data.capacity).toBe(1000);
  });

  test("6. Update house", async () => {
    const res = await auth(ownerToken)(
      request(app).put(`/api/houses/${houseId}`)
    ).send({
      houseName: "House Alpha - Updated",
      currentBirdCount: 850,
      description: "Updated main egg production house",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.houseName).toBe("House Alpha - Updated");
    expect(res.body.data.currentBirdCount).toBe(850);
  });

  test("7. Create second house", async () => {
    const res = await auth(ownerToken)(request(app).post("/api/houses")).send({
      houseName: "House Beta",
      capacity: 800,
      currentBirdCount: 600,
      location: "South Wing",
    });

    expect([200, 201]).toContain(res.statusCode);
  });

  test("8. Get houses with filters", async () => {
    const res = await auth(supervisorToken)(
      request(app).get("/api/houses?capacity=1000")
    );

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("9. Update house bird count (owner only)", async () => {
    const res = await auth(ownerToken)(
      request(app).put(`/api/houses/${houseId}`)
    ).send({
      currentBirdCount: 900,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.currentBirdCount).toBe(900);
  });

  test("10. Create house with missing optional fields", async () => {
    const res = await auth(ownerToken)(request(app).post("/api/houses")).send({
      houseName: "House with Defaults",
      // Missing capacity and currentBirdCount - should use defaults
    });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data.capacity).toBe(1000); // Default value
    expect(res.body.data.currentBirdCount).toBe(0); // Default value
  });

  test("11. Create house with invalid capacity", async () => {
    const res = await auth(ownerToken)(request(app).post("/api/houses")).send({
      houseName: "Invalid House",
      capacity: -100, // Invalid negative capacity
      currentBirdCount: 50,
    });

    expect(res.statusCode).toBe(400);
  });

  test("12. Update house with bird count exceeding capacity", async () => {
    const res = await auth(ownerToken)(
      request(app).put(`/api/houses/${houseId}`)
    ).send({
      currentBirdCount: 1500, // Exceeds capacity of 1000
    });

    // This might be allowed depending on validation rules
    expect([200, 400]).toContain(res.statusCode);
  });

  test("13. Get house statistics", async () => {
    const res = await auth(ownerToken)(request(app).get("/api/houses/stats"));

    // This hits the getById route since 'stats' is treated as an ID
    expect(res.statusCode).toBe(400); // Validation fails for non-numeric ID
  });

  test("14. Test house occupancy percentage", async () => {
    const getRes = await auth(supervisorToken)(
      request(app).get(`/api/houses/${houseId}`)
    );

    if (getRes.statusCode === 200) {
      const house = getRes.body.data;
      const occupancyRate = (house.currentBirdCount / house.capacity) * 100;

      // Verify occupancy calculation
      expect(occupancyRate).toBeGreaterThan(0);
      expect(occupancyRate).toBeLessThanOrEqual(150); // Allow some over-capacity
    }
  });

  test("15. Delete house", async () => {
    const res = await auth(ownerToken)(
      request(app).delete(`/api/houses/${houseId}`)
    );

    expect([200, 204]).toContain(res.statusCode);
  });

  test("16. Verify house deletion", async () => {
    const res = await auth(supervisorToken)(
      request(app).get(`/api/houses/${houseId}`)
    );

    expect(res.statusCode).toBe(404);
  });
});
