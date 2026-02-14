import request from "supertest";
import app from "../../../testApp.js";
import { autoMigrate, sequelize } from "../../../dist/utils/database.js";
import bcrypt from "bcrypt";

describe("POST /api/feed/batches/estimate", () => {
  let ownerToken;

  beforeAll(async () => {
    await autoMigrate();

    // Create owner user for authentication
    const { default: User } = await import("../../../dist/models/User.js");
    const hash = await bcrypt.hash("owner123", 10);
    await User.create({
      username: "testowner",
      password: hash,
      role: "owner",
      fullName: "Test Owner",
    });

    // Login to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "testowner", password: "owner123" });
    ownerToken = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("returns cost estimate for a valid recipe", async () => {
    const payload = {
      ingredients: [
        {
          ingredientName: "Corn",
          quantityKg: 500,
          totalCost: 1000,
        },
        {
          ingredientName: "Soybean",
          quantityKg: 500,
          totalCost: 1500,
        },
      ],
      bagSizeKg: 50,
    };

    const res = await request(app)
      .post("/api/feed/batches/estimate")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(payload)
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("totalCost");
  });
});
