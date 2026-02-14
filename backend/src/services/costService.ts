import DailyLog from "../models/DailyLog.js";
import FeedBatch from "../models/FeedBatch.js";
import OperatingCost from "../models/OperatingCost.js";
import Payroll from "../models/Payroll.js";
import { BadRequestError } from "../utils/exceptions.js";
import { Op } from "sequelize";
import type {
  BirdCostEntity,
  DailyLogEntity,
  FeedBatchEntity,
  OperatingCostEntity,
  PayrollEntity,
} from "../types/entities.js";

type DailyLogWithLegacyFeed = DailyLogEntity & {
  feedGivenKg?: number | string | null;
};

const toDailyLogs = (rows: unknown): DailyLogWithLegacyFeed[] =>
  rows as DailyLogWithLegacyFeed[];

const toPayrollRows = (rows: unknown): PayrollEntity[] => rows as PayrollEntity[];

const costService = {
  // Helper function to get average monthly production (Design 7.1)
  getAverageMonthlyProduction: async (date: string | undefined) => {
    if (!date) throw new BadRequestError("date is required");
    const monthKey = date.substring(0, 7); // YYYY-MM
    const parts = date.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthStart = monthKey + "-01";
    const monthEnd = `${monthKey}-${daysInMonth.toString().padStart(2, "0")}`;

    const monthlyLogs = toDailyLogs(await DailyLog.findAll({
      where: { logDate: { [Op.between]: [monthStart, monthEnd] } },
    }));

    if (monthlyLogs.length === 0) return 0;

    const totalMonthlyEggs = monthlyLogs.reduce(
      (s, l) => s + (Number(l.eggsCollected) || 0),
      0
    );

    return totalMonthlyEggs;
  },

  // Helper function to get working days in month (excluding Sundays)
  getWorkingDaysInMonth: (date: string | undefined) => {
    if (!date) throw new BadRequestError("date is required");
    const parts = date.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek !== 0) {
        // 0 = Sunday
        workingDays++;
      }
    }
    return workingDays;
  },

  getDailyCosts: async (date: string | undefined) => {
    if (!date) throw new BadRequestError("date is required");

    // aggregate daily logs
    const logs = toDailyLogs(await DailyLog.findAll({ where: { logDate: date } }));

    // coerce values (Sequelize may return DECIMAL as strings)
    const totalEggs = logs.reduce(
      (s, l) => s + (Number(l.eggsCollected) || 0),
      0
    );

    // feed cost: sum feedBagsUsed * estimate price per bag from recent feed batches
    const totalFeedBags = logs.reduce(
      (s, l) => s + (Number(l.feedBagsUsed ?? 0) || 0),
      0
    );

    let feedCost = 0;
    let totalFeedKg = 0;
    if (totalFeedBags > 0) {
      // approximate by using latest feed batch costPerBag
      const latestBatch = (await FeedBatch.findOne({
        order: [["batchDate", "DESC"]],
      })) as FeedBatchEntity | null;
      const costPerBag = latestBatch ? Number(latestBatch.costPerBag) || 0 : 0;
      const bagSizeKg = latestBatch ? Number(latestBatch.bagSizeKg) || 50 : 50;
      feedCost = totalFeedBags * costPerBag;
      totalFeedKg = totalFeedBags * bagSizeKg;
    }

    return {
      date,
      totalEggs,
      totalFeedKg,
      feedCost,
      feedCostPerEgg: totalEggs ? feedCost / totalEggs : 0,
    };
  },

  getSummary: async (start: string | undefined, end: string | undefined) => {
    if (!start || !end) throw new BadRequestError("start and end are required");
    const logs = toDailyLogs(await DailyLog.findAll({
      where: { logDate: { [Op.between]: [start, end] } },
    }));
    const totalEggs = logs.reduce(
      (s, l) => s + (Number(l.eggsCollected) || 0),
      0
    );
    const totalFeedBags = logs.reduce(
      (s, l) => s + (Number(l.feedBagsUsed ?? 0) || 0),
      0
    );
    
    // Get bag size from latest batch for kg conversion
    const latestBatch = (await FeedBatch.findOne({
      order: [["batchDate", "DESC"]],
    })) as FeedBatchEntity | null;
    const bagSizeKg = latestBatch ? Number(latestBatch.bagSizeKg) || 50 : 50;
    const totalFeedKg = totalFeedBags * bagSizeKg;

    return { start, end, totalEggs, totalFeedKg, totalFeedBags };
  },

  createOperatingCosts: async (
    data: Partial<OperatingCostEntity> & { monthYear: string },
  ) => {
    if (!data.monthYear) throw new BadRequestError("monthYear is required");
    // normalize month key for payroll lookup (YYYY-MM)
    const monthKey = (data.monthYear || "").toString().slice(0, 7);
    const existing = await OperatingCost.findOne({
      where: { monthYear: data.monthYear },
    });
    if (existing)
      throw new BadRequestError("Operating costs for this month already exist");

    // If totalLaborerSalaries not provided, use Payroll records for the month
    let laborSalaries = Number(data.totalLaborerSalaries || 0);
    if (!laborSalaries) {
      const payrollRows = toPayrollRows(await Payroll.findAll({
        where: { monthYear: monthKey },
      }));
      laborSalaries = payrollRows.reduce(
        (s, p) => s + (Number(p.finalSalary) || 0),
        0
      );
    }

    const totalMonthlyCost =
      (Number(data.supervisorSalary) || 0) +
      laborSalaries +
      (Number(data.electricityCost) || 0) +
      (Number(data.waterCost) || 0) +
      (Number(data.maintenanceCost) || 0) +
      (Number(data.otherCosts) || 0);

    const oc = await OperatingCost.create({
      ...data,
      totalLaborerSalaries: laborSalaries,
      totalMonthlyCost,
    });
    return oc;
  },

  getEggPriceEstimate: async (date: string | undefined) => {
    if (!date) throw new BadRequestError("date is required");

    // Get daily costs for feed
    const daily = await costService.getDailyCosts(date);
    const feedCostPerEgg = daily.feedCostPerEgg || 0;

    // Get monthly context for fixed cost distribution
    const monthKey = date.substring(0, 7); // YYYY-MM
    const monthStart = monthKey + "-01";
    const parts = date.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get average monthly production using the new helper function (Design 7.1)
    const avgMonthlyProduction = await costService.getAverageMonthlyProduction(
      date
    );
    const avgDailyProduction =
      avgMonthlyProduction > 0
        ? avgMonthlyProduction / daysInMonth
        : daily.totalEggs || 1;

    // Get monthly labor costs from payroll (Design 7.3)
    const payrollRows = toPayrollRows(await Payroll.findAll({
      where: { monthYear: monthKey },
    }));
    const monthlyLaborCosts = payrollRows.reduce(
      (s, p) => s + (Number(p.finalSalary) || 0),
      0
    );

    // Get other operating costs for the month (supervisor, utilities, etc.)
    const op = (await OperatingCost.findOne({
      where: { monthYear: monthStart },
    })) as OperatingCostEntity | null;
    const monthlyOperatingCosts = op
      ? (Number(op.supervisorSalary) || 0) +
        (Number(op.electricityCost) || 0) +
        (Number(op.waterCost) || 0) +
        (Number(op.maintenanceCost) || 0) +
        (Number(op.otherCosts) || 0)
      : 0;

    // Calculate costs per egg based on average monthly production (Design 7.1)
    const laborCostPerEgg =
      avgDailyProduction > 0
        ? monthlyLaborCosts / daysInMonth / avgDailyProduction
        : 0;
    const fixedCostPerEgg =
      avgDailyProduction > 0
        ? monthlyOperatingCosts / daysInMonth / avgDailyProduction
        : 0;

    // Calculate health cost per egg (bird costs distributed over laying period)
    const healthCostPerEgg = await costService.calculateHealthCostPerEgg(date);

    const totalCostPerEgg =
      feedCostPerEgg + laborCostPerEgg + fixedCostPerEgg + healthCostPerEgg;

    return {
      date,
      avgMonthlyProduction,
      avgDailyProduction,
      feedCostPerEgg,
      laborCostPerEgg,
      fixedCostPerEgg,
      healthCostPerEgg,
      totalCostPerEgg,
      suggestedPrice: totalCostPerEgg * 1.2, // 20% markup
    };
  },

  // Calculate health costs per egg (bird acquisition costs distributed over laying period)
  calculateHealthCostPerEgg: async (date: string | undefined) => {
    if (!date) return 0;

    // Import BirdCost lazily to avoid circular deps
    type BirdCostModel = {
      findAll: () => Promise<unknown[]>;
    };
    let birdCostModel: BirdCostModel | null = null;
    try {
      const imported = (await import("../models/BirdCost.js")) as {
        default?: BirdCostModel;
      };
      birdCostModel = imported.default ?? null;
      // Test if the model is properly initialized
      if (!birdCostModel || typeof birdCostModel.findAll !== "function") {
        return 0;
      }
    } catch {
      // model not present or import failed
      return 0;
    }

    // Get total eggs produced on the date
    const logs = toDailyLogs(await DailyLog.findAll({ where: { logDate: date } }));
    const totalEggs = logs.reduce(
      (s, l) => s + (Number(l.eggsCollected) || 0),
      0
    );

    // Find bird batches whose laying window includes the date
    let allBatches: BirdCostEntity[] = [];
    try {
      allBatches = (await birdCostModel.findAll()) as BirdCostEntity[];
    } catch {
      // Database table might not exist
      return 0;
    }
    if (!allBatches || allBatches.length === 0) return 0;

    // For each batch, if date is within [batchDate, batchDate + expectedLayingMonths months], include amortized cost
    const target = new Date(date);
    let dailyBirdCostTotal = 0;
    for (const b of allBatches) {
      const batchDate = new Date(b.batchDate);
      const months = Number(b.expectedLayingMonths) || 0;
      if (months <= 0) continue;

      // compute end date by adding months
      const endDate = new Date(batchDate);
      endDate.setMonth(endDate.getMonth() + months);

      if (target < batchDate || target >= endDate) continue;

      const birds = Number(b.birdsPurchased) || 0;
      const costPerBird = Number(b.costPerBird) || 0;
      const vacc = Number(b.vaccinationCostPerBird) || 0;
      const totalCost = birds * (costPerBird + vacc);

      // approximate total laying days
      const totalLayingDays = months * 30; // approximate to 30 days/month
      if (totalLayingDays <= 0) continue;

      const perDayCost = totalCost / totalLayingDays;
      dailyBirdCostTotal += perDayCost;
    }

    if (totalEggs <= 0) return 0;

    const healthCostPerEgg = dailyBirdCostTotal / totalEggs;
    return healthCostPerEgg;
  },

  // Daily cost calculation as per Design 7.1
  calculateDailyCost: async (date: string | undefined) => {
    if (!date) throw new BadRequestError("date is required");

    // Get daily production data
    const dailyLogs = toDailyLogs(await DailyLog.findAll({ where: { logDate: date } }));
    const totalEggs = dailyLogs.reduce(
      (sum, log) => sum + (Number(log.eggsCollected) || 0),
      0
    );

    if (totalEggs === 0) {
      return {
        date,
        totalEggs: 0,
        feedCostPerEgg: 0,
        laborCostPerEgg: 0,
        fixedCostPerEgg: 0,
        healthCostPerEgg: 0,
        totalCostPerEgg: 0,
        suggestedPrice: 0,
      };
    }

    // Calculate feed cost
    const latestBatchForFeed = (await FeedBatch.findOne({
      order: [["batchDate", "DESC"]],
    })) as FeedBatchEntity | null;
    const bagSizeKg = latestBatchForFeed
      ? Number(latestBatchForFeed.bagSizeKg) || 50
      : 50;
    const costPerKg = latestBatchForFeed
      ? Number(latestBatchForFeed.costPerKg) || 0
      : 0;

    const totalFeedKg = dailyLogs.reduce((sum, log) => {
      const legacyFeedKg = Number(log.feedGivenKg ?? 0);
      if (legacyFeedKg > 0) {
        return sum + legacyFeedKg;
      }

      const feedBagsUsed = Number(log.feedBagsUsed ?? 0);
      return sum + feedBagsUsed * bagSizeKg;
    }, 0);

    let feedCost = 0;
    if (totalFeedKg > 0) {
      feedCost = totalFeedKg * costPerKg;
    }
    const feedCostPerEgg = feedCost / totalEggs;

    // Calculate monthly labor cost distributed daily
    const monthKey = date.substring(0, 7); // YYYY-MM
    const parts = date.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    const payrollRows = toPayrollRows(await Payroll.findAll({
      where: { monthYear: monthKey },
    }));
    const monthlyLaborCosts = payrollRows.reduce(
      (sum, p) => sum + (Number(p.finalSalary) || 0),
      0
    );

    const avgDailyProduction =
      (await costService.getAverageMonthlyProduction(date)) / daysInMonth;
    const laborCostPerEgg =
      avgDailyProduction > 0
        ? monthlyLaborCosts / daysInMonth / avgDailyProduction
        : 0;

    // Calculate other fixed costs (supervisor, utilities, etc.)
    const monthStart = monthKey + "-01";
    const op = (await OperatingCost.findOne({
      where: { monthYear: monthStart },
    })) as OperatingCostEntity | null;
    const monthlyOperatingCosts = op
      ? (Number(op.supervisorSalary) || 0) +
        (Number(op.electricityCost) || 0) +
        (Number(op.waterCost) || 0) +
        (Number(op.maintenanceCost) || 0) +
        (Number(op.otherCosts) || 0)
      : 0;

    const fixedCostPerEgg =
      avgDailyProduction > 0
        ? monthlyOperatingCosts / daysInMonth / avgDailyProduction
        : 0;

    // Calculate health costs (bird costs distributed over laying period)
    const healthCostPerEgg = await costService.calculateHealthCostPerEgg(date);

    const totalCostPerEgg =
      feedCostPerEgg + laborCostPerEgg + fixedCostPerEgg + healthCostPerEgg;

    return {
      date,
      totalEggs,
      feedCostPerEgg,
      laborCostPerEgg,
      fixedCostPerEgg,
      healthCostPerEgg,
      totalCostPerEgg,
      suggestedPrice: totalCostPerEgg * 1.2, // 20% markup
    };
  },
};

export default costService;
