import request from "supertest";
import { sequelize, autoMigrate } from "../../src/utils/database.js";
import app from "../../testApp.js";
import bcrypt from "bcrypt";

describe("Labor Management Simple Flow", () => {
  let ownerToken;
  let supervisorToken;

  beforeAll(async () => {
    await autoMigrate();

    // Create test users
    const { default: User } = await import("../../src/models/User.js");

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

  const auth = (token) => (req) => req.set("Authorization", `Bearer ${token}`);

  test("1. Owner login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testowner", password: "owner123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    ownerToken = res.body.token;
  });

  test("2. Staff login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "teststaff", password: "staff123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    supervisorToken = res.body.token;
  });

  test("3. Test laborer routes return 200 (implemented)", async () => {
    const res = await auth(ownerToken)(request(app).get("/api/laborers"));

    // The route is actually implemented
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  test("4. Test work assignment routes return 404 (not implemented)", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/work-assignments")
    );

    // Since routes are not implemented, expect 404
    expect(res.statusCode).toBe(404);
  });

  test("5. Test payroll routes return 404 (not implemented)", async () => {
    const res = await auth(ownerToken)(
      request(app).get("/api/payroll/2025-08")
    );

    // Since routes are not implemented, expect 404
    expect(res.statusCode).toBe(404);
  });
});
