import { autoMigrate, sequelize } from "../../../src/utils/database.js";
import DailyLog from "../../../src/models/DailyLog.js";
import House from "../../../src/models/House.js";
import costService from "../../../src/services/costService.js";

beforeAll(async () => {
  await autoMigrate();
});

afterAll(async () => {
  await sequelize.close();
});

describe("costService helpers", () => {
  test("getWorkingDaysInMonth excludes Sundays", () => {
    const working = costService.getWorkingDaysInMonth("2025-08-01");
    // August 2025 has 31 days; Sundays are on 3,10,17,24,31 => 5 Sundays -> 26 working days
    expect(working).toBe(26);
  });

  test("getAverageMonthlyProduction returns 0 when no logs", async () => {
    const total = await costService.getAverageMonthlyProduction("2025-09-01");
    expect(total).toBe(0);
  });

  test("getAverageMonthlyProduction sums eggs", async () => {
    // create a house to satisfy foreign key
    const house = await House.create({ name: "Test House" });
    await DailyLog.create({
      logDate: "2025-07-01",
      eggsCollected: 15,
      feedBagsUsed: 1,
      mortalityCount: 0,
      houseId: house.id,
    });
    await DailyLog.create({
      logDate: "2025-07-02",
      eggsCollected: 20,
      feedBagsUsed: 1,
      mortalityCount: 1,
      houseId: house.id,
    });
    const total = await costService.getAverageMonthlyProduction("2025-07-15");
    expect(total).toBe(35);

    // cleanup
    await DailyLog.destroy({
      where: { logDate: ["2025-07-01", "2025-07-02"] },
    });
    await House.destroy({ where: { id: house.id } });
  });
});
