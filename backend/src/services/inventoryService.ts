import { Op } from "sequelize";
import DailyLog from "../models/DailyLog.js";
import Sales from "../models/Sales.js";
import House from "../models/House.js";
import EggAdjustment from "../models/EggAdjustment.js";
import type { DailyLogEntity, SalesEntity } from "../types/entities.js";
import type { Model } from "sequelize";

// Interface for plain EggAdjustment
export interface EggAdjustmentEntity {
  id: number;
  date: string;
  quantity: number;
  reason: string | null;
  userId: number | null;
}

const EGGS_PER_CRATE = 30;

const toPlain = <T extends object>(rows: Model[]): T[] =>
  rows.map((r) => r.toJSON() as T);

export interface EggInventorySummary {
  period: { start: string; end: string };
  eggsPerCrate: number;
  openingBalance: number;
  totalCollected: number;
  totalCracked: number;
  totalSoldEggs: number; // crates × 30
  totalSoldCrates: number;
  totalAdjustments: number;
  netStock: number; // opening + collected - cracked - soldEggs + adjustments
  netStockCrates: number;
  netStockPieces: number;
  dailyFlow: DailyFlowRow[];
}

export interface DailyFlowRow {
  date: string;
  collected: number;
  cracked: number;
  soldEggs: number;
  soldCrates: number;
  adjusted: number;
  net: number;
}

const inventoryService = {
  getEggInventory: async (
    start: string,
    end: string,
  ): Promise<EggInventorySummary> => {
    // ----------------------------------------------------------------------
    // 1. Calculate Opening Balance (all activity prior to start date)
    // ----------------------------------------------------------------------
    const pastLogs = toPlain<DailyLogEntity>(
      await DailyLog.findAll({
        where: { logDate: { [Op.lt]: start } },
      }),
    );
    const pastSales = toPlain<SalesEntity>(
      await Sales.findAll({
        where: { saleDate: { [Op.lt]: start } },
      }),
    );
    const pastAdjustments = toPlain<EggAdjustmentEntity>(
      await EggAdjustment.findAll({
        where: { date: { [Op.lt]: start } },
      }),
    );

    const pastCollected = pastLogs.reduce((s, l) => s + (Number(l.eggsCollected) || 0), 0);
    const pastCracked = pastLogs.reduce((s, l) => s + (Number(l.crackedEggs) || 0), 0);
    const pastSold = pastSales.reduce((s, r) => s + (Number(r.quantity) || 0), 0) * EGGS_PER_CRATE;
    const pastAdjTotal = pastAdjustments.reduce((s, a) => s + (Number(a.quantity) || 0), 0);
    
    const openingBalance = pastCollected - pastCracked - pastSold + pastAdjTotal;

    // ----------------------------------------------------------------------
    // 2. Compute Daily Flow within the requested window
    // ----------------------------------------------------------------------
    const rawLogs = toPlain<DailyLogEntity>(
      await DailyLog.findAll({
        where: { logDate: { [Op.between]: [start, end] } },
        include: [{ model: House, as: "House", attributes: ["houseName"] }],
        order: [["logDate", "ASC"]],
      }),
    );

    const rawSales = toPlain<SalesEntity>(
      await Sales.findAll({
        where: { saleDate: { [Op.between]: [start, end] } },
        order: [["saleDate", "ASC"]],
      }),
    );

    const rawAdjustments = toPlain<EggAdjustmentEntity>(
      await EggAdjustment.findAll({
        where: { date: { [Op.between]: [start, end] } },
        order: [["date", "ASC"]],
      }),
    );

    // Aggregate by date
    const logsByDate = new Map<string, { collected: number; cracked: number }>();
    for (const log of rawLogs) {
      const date = log.logDate as string;
      const existing = logsByDate.get(date) ?? { collected: 0, cracked: 0 };
      existing.collected += Number(log.eggsCollected) || 0;
      existing.cracked += Number(log.crackedEggs) || 0;
      logsByDate.set(date, existing);
    }

    const salesByDate = new Map<string, { crates: number }>();
    for (const sale of rawSales) {
      const date = sale.saleDate as string;
      const existing = salesByDate.get(date) ?? { crates: 0 };
      existing.crates += Number(sale.quantity) || 0;
      salesByDate.set(date, existing);
    }

    const adjustmentsByDate = new Map<string, { quantity: number }>();
    for (const adj of rawAdjustments) {
      const date = adj.date;
      const existing = adjustmentsByDate.get(date) ?? { quantity: 0 };
      existing.quantity += Number(adj.quantity) || 0;
      adjustmentsByDate.set(date, existing);
    }

    const allDates = new Set([
      ...logsByDate.keys(),
      ...salesByDate.keys(),
      ...adjustmentsByDate.keys(),
    ]);
    const sortedDates = [...allDates].sort();

    const dailyFlow: DailyFlowRow[] = sortedDates.map((date) => {
      const log = logsByDate.get(date) ?? { collected: 0, cracked: 0 };
      const sale = salesByDate.get(date) ?? { crates: 0 };
      const adjustment = adjustmentsByDate.get(date) ?? { quantity: 0 };
      const soldEggs = sale.crates * EGGS_PER_CRATE;
      
      const net = log.collected - log.cracked - soldEggs + adjustment.quantity;
      return {
        date,
        collected: log.collected,
        cracked: log.cracked,
        soldEggs,
        soldCrates: sale.crates,
        adjusted: adjustment.quantity,
        net,
      };
    });

    // Totals for this period
    const totalCollected = dailyFlow.reduce((s, r) => s + r.collected, 0);
    const totalCracked = dailyFlow.reduce((s, r) => s + r.cracked, 0);
    const totalSoldCrates = dailyFlow.reduce((s, r) => s + r.soldCrates, 0);
    const totalSoldEggs = totalSoldCrates * EGGS_PER_CRATE;
    const totalAdjustments = dailyFlow.reduce((s, r) => s + r.adjusted, 0);
    
    // Net stock at the very end (Opening + Period Net Flow)
    const netStock = openingBalance + totalCollected - totalCracked - totalSoldEggs + totalAdjustments;
    const netStockCrates = Math.floor(netStock / EGGS_PER_CRATE);
    const netStockPieces = netStock % EGGS_PER_CRATE;

    return {
      period: { start, end },
      eggsPerCrate: EGGS_PER_CRATE,
      openingBalance,
      totalCollected,
      totalCracked,
      totalSoldEggs,
      totalSoldCrates,
      totalAdjustments,
      netStock,
      netStockCrates,
      netStockPieces,
      dailyFlow,
    };
  },
};

export default inventoryService;
