import request from "supertest";
import app from "../../testApp.js";
import jwt from "jsonwebtoken";
import config from "../../src/config/auth.js";
import { autoMigrate } from "../../src/utils/database.js";

describe("Reports RBAC", () => {
  const endpoint = "/api/reports/production?start=2025-08-01&end=2025-08-31";

  beforeAll(async () => {
    await autoMigrate();
  });

  test("unauthenticated requests receive 401", async () => {
    const res = await request(app).get(endpoint);
    expect(res.statusCode).toBe(401);
  });

  test("wrong role receives 403", async () => {
    const token = jwt.sign(
      { id: 2, username: "worker", role: "worker" },
      config.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  test("owner role allowed (200)", async () => {
    const token = jwt.sign(
      { id: 3, username: "owner", role: "owner" },
      config.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start");
    expect(res.body.data).toHaveProperty("end");
    expect(res.body.data).toHaveProperty("totalEggs");
  });

  test("staff role allowed (200)", async () => {
    const token = jwt.sign(
      { id: 4, username: "staff", role: "staff" },
      config.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .get(endpoint)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("start");
    expect(res.body.data).toHaveProperty("end");
    expect(res.body.data).toHaveProperty("totalEggs");
  });
});
