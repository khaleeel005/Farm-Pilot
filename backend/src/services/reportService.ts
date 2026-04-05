import DailyLog from "../models/DailyLog.js";
import Sales from "../models/Sales.js";
import OperatingCost from "../models/OperatingCost.js";
import CostEntry from "../models/CostEntry.js";
import FeedBatch from "../models/FeedBatch.js";
import { Op } from "sequelize";
import type { Model } from "sequelize";
import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";
import type {
  DailyLogEntity,
  OperatingCostEntity,
  SalesEntity,
  CostEntryEntity,
  FeedBatchEntity,
} from "../types/entities.js";
import type { ReportType } from "../types/dto.js";
import { BadRequestError, InternalServerError } from "../utils/exceptions.js";

type ReportRow = Record<string, string | number | null | undefined>;
const toPlainRows = <T extends object>(rows: Model[]): T[] =>
  rows.map((row) => row.toJSON() as T);

const reportService = {
  getProductionReport: async (
    start: string | undefined,
    end: string | undefined,
  ) => {
    if (!start || !end) throw new BadRequestError("start and end are required");
    const logs = toPlainRows<DailyLogEntity>(
      await DailyLog.findAll({
        where: { logDate: { [Op.between]: [start, end] } },
      }),
    );
    const totalEggs = logs.reduce(
      (s, l) => s + (Number(l.eggsCollected) || 0),
      0,
    );
    const days = logs.length;
    const avgPerDay = days ? totalEggs / days : 0;
    return { start, end, days, totalEggs, avgPerDay, logs };
  },

  getSalesReport: async (
    start: string | undefined,
    end: string | undefined,
  ) => {
    if (!start || !end) throw new BadRequestError("start and end are required");
    const rows = toPlainRows<SalesEntity>(
      await Sales.findAll({
        where: { saleDate: { [Op.between]: [start, end] } },
      }),
    );
    const totalAmount = rows.reduce(
      (s, r) => s + (Number(r.totalAmount) || 0),
      0,
    );
    const totalCrates = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    return { start, end, totalAmount, totalCrates, rows };
  },

  getFinancialReport: async (
    start: string | undefined,
    end: string | undefined,
  ) => {
    if (!start || !end) throw new BadRequestError("start and end are required");
    // Operating costs: Since monthYear is stored as a date (e.g., YYYY-MM-01),
    // and the incoming start/end might be mid-month, we adjust the query to include
    // any OperatingCost whose monthYear falls in the same month(s) as the start/end dates.
    const startParts = start.split("-");
    const trueStart = `${startParts[0]}-${startParts[1]}-01`;

    const endParts = end.split("-");
    const endYear = parseInt(endParts[0] || "0", 10);
    const endMonth = parseInt(endParts[1] || "0", 10);
    // getting the last day of the month accurately without timezone shifts
    const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
    const trueEnd = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const ops = toPlainRows<OperatingCostEntity>(
      await OperatingCost.findAll({
        where: { monthYear: { [Op.between]: [trueStart, trueEnd] } },
      }),
    );
    const totalOperating = ops.reduce(
      (s, o) => s + (Number(o.totalMonthlyCost) || 0),
      0,
    );

    // Sales total (keeps original exact date filter)
    const sales = toPlainRows<SalesEntity>(
      await Sales.findAll({
        where: { saleDate: { [Op.between]: [start, end] } },
      }),
    );
    const totalSales = sales.reduce(
      (s, r) => s + (Number(r.totalAmount) || 0),
      0,
    );

    // Cost entries: individual expense records within the exact date range
    const costEntries = toPlainRows<CostEntryEntity>(
      await CostEntry.findAll({
        where: { date: { [Op.between]: [start, end] } },
      }),
    );
    const totalCostEntries = costEntries.reduce(
      (s, c) => s + (Number(c.amount) || 0),
      0,
    );

    // Breakdown by cost type
    const costEntriesByType = costEntries.reduce<Record<string, number>>(
      (acc, c) => {
        const type = c.costType || "other";
        acc[type] = (acc[type] || 0) + (Number(c.amount) || 0);
        return acc;
      },
      {},
    );

    // Feed costs: calculate from actual daily log consumption (bags used × batch costPerBag)
    // Only count logs that have a feedBatchId and feedBagsUsed > 0
    const logs = toPlainRows<DailyLogEntity>(
      await DailyLog.findAll({
        where: {
          logDate: { [Op.between]: [start, end] },
          feedBatchId: { [Op.ne]: null },
          feedBagsUsed: { [Op.gt]: 0 },
        },
      }),
    );

    // Group bags used by batch ID
    const bagsByBatch = logs.reduce<Record<number, number>>((acc, log) => {
      const batchId = log.feedBatchId!;
      acc[batchId] = (acc[batchId] || 0) + (Number(log.feedBagsUsed) || 0);
      return acc;
    }, {});

    // Fetch the batches and calculate feed cost
    const batchIds = Object.keys(bagsByBatch).map(Number);
    let totalFeedCost = 0;
    const feedCostByBatch: Record<string, number> = {};

    if (batchIds.length > 0) {
      const batches = toPlainRows<FeedBatchEntity>(
        await FeedBatch.findAll({
          where: { id: { [Op.in]: batchIds } },
        }),
      );

      for (const batch of batches) {
        const bagsUsed = bagsByBatch[batch.id] || 0;
        const costPerBag = Number(batch.costPerBag) || 0;
        const batchCost = bagsUsed * costPerBag;
        totalFeedCost += batchCost;
        feedCostByBatch[batch.batchName || `Batch #${batch.id}`] =
          Math.round(batchCost);
      }
    }

    // Total expenses = operating costs + cost entries + feed costs
    const totalExpenses = totalOperating + totalCostEntries + totalFeedCost;

    return {
      start,
      end,
      totalOperating,
      totalCostEntries,
      totalFeedCost: Math.round(totalFeedCost),
      totalExpenses,
      totalSales,
      ops,
      sales,
      costEntries,
      costEntriesByType,
      feedCostByBatch,
    };
  },

  exportReportCsv: async (
    type: ReportType | string | undefined,
    start: string | undefined,
    end: string | undefined,
  ) => {
    let data: ReportRow[] = [];
    if (type === "production") {
      const r = await reportService.getProductionReport(start, end);
      data = r.logs.map((l) => ({
        date: l.logDate,
        eggsCollected: l.eggsCollected,
        crackedEggs: l.crackedEggs,
        feedBagsUsed: l.feedBagsUsed,
        mortality: l.mortalityCount,
      }));
    } else if (type === "sales") {
      const r = await reportService.getSalesReport(start, end);
      data = r.rows.map((s) => ({
        date: s.saleDate,
        quantity: s.quantity,
        pricePerCrate: s.pricePerCrate,
        totalAmount: s.totalAmount,
      }));
    } else if (type === "financial") {
      const r = await reportService.getFinancialReport(start, end);
      // Export operating costs
      const opsData = r.ops.map((o) => ({
        type: "operating_cost",
        monthYear: o.monthYear,
        totalMonthlyCost: o.totalMonthlyCost,
        supervisorSalary: o.supervisorSalary,
      }));
      // Export cost entries
      const entriesData = r.costEntries.map((c) => ({
        type: "cost_entry",
        date: c.date,
        costType: c.costType,
        description: c.description,
        amount: c.amount,
        category: c.category,
        vendor: c.vendor || "",
      }));
      // Export feed batch costs
      const feedData = Object.entries(r.feedCostByBatch).map(
        ([batchName, cost]) => ({
          type: "feed_cost",
          batchName,
          amount: cost,
        }),
      );
      data = [...opsData, ...entriesData, ...feedData];
    } else {
      throw new BadRequestError("unsupported export type");
    }

    // Handle empty data case - json2csv throws error on empty arrays
    if (data.length === 0) {
      return ""; // Return empty CSV
    }

    const parser = new CsvParser();
    const csv = parser.parse(data);
    return csv;
  },

  exportReportPdf: async (
    type: ReportType | string | undefined,
    start: string | undefined,
    end: string | undefined,
  ) => {
    // Build a simple PDF containing the report summary and table rows
    let title = "Report";
    let rows: ReportRow[] = [];

    if (type === "production") {
      title = "Production Report";
      const r = await reportService.getProductionReport(start, end);
      rows = r.logs.map((l) => ({
        date: l.logDate,
        eggsCollected: l.eggsCollected,
        crackedEggs: l.crackedEggs,
        feedBagsUsed: l.feedBagsUsed,
        mortality: l.mortalityCount,
      }));
    } else if (type === "sales") {
      title = "Sales Report";
      const r = await reportService.getSalesReport(start, end);
      rows = r.rows.map((s) => ({
        date: s.saleDate,
        quantity: s.quantity,
        pricePerCrate: s.pricePerCrate,
        totalAmount: s.totalAmount,
      }));
    } else if (type === "financial") {
      title = "Financial Report";
      const r = await reportService.getFinancialReport(start, end);
      // Operating costs
      const opsRows = r.ops.map((o) => ({
        type: "Operating",
        period: o.monthYear,
        amount: o.totalMonthlyCost,
        details: `Supervisor: ${o.supervisorSalary || 0}`,
      }));
      // Cost entries
      const entryRows = r.costEntries.map((c) => ({
        type: c.costType || "Other",
        period: c.date,
        amount: c.amount,
        details: c.description || "",
      }));
      // Feed costs
      const feedRows = Object.entries(r.feedCostByBatch).map(
        ([batchName, cost]) => ({
          type: "Feed",
          period: batchName,
          amount: cost,
          details: "Feed consumption",
        }),
      );
      rows = [...opsRows, ...entryRows, ...feedRows];
    } else {
      throw new BadRequestError("unsupported export type");
    }

    // Create PDF document in memory buffer
    const doc = new PDFDocument({ margin: 40 });
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer({
      initialSize: 100 * 1024,
      incrementAmount: 10 * 1024,
    });
    doc.pipe(writableStreamBuffer);

    doc.fontSize(18).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Period: ${start} to ${end}`);
    doc.moveDown();

    // Simple table: print header then rows
    if (rows.length === 0) {
      doc.text("No data available for the selected range.");
    } else {
      // Header
      const firstRow = rows[0];
      const headers = firstRow ? Object.keys(firstRow) : [];

      // Calculate equal column width based on available page width (595 - 2*40 margins = 515)
      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = headers.length > 0 ? usableWidth / headers.length : 100;

      // Draw Headers
      let currentY = doc.y;
      headers.forEach((h, i) => {
        doc
          .font("Helvetica-Bold")
          .text(
            h.toUpperCase(),
            doc.page.margins.left + i * colWidth,
            currentY,
            { width: colWidth, align: "left" },
          );
      });
      doc.moveDown(0.5);

      // Rows
      rows.forEach((r) => {
        currentY = doc.y;

        // Add a new page if we are too close to the bottom margin
        if (currentY > doc.page.height - doc.page.margins.bottom - 20) {
          doc.addPage();
          currentY = doc.y;
        }

        Object.values(r).forEach((v, i) => {
          doc
            .font("Helvetica")
            .text(String(v), doc.page.margins.left + i * colWidth, currentY, {
              width: colWidth,
              align: "left",
              continued: false,
            });
        });
        doc.moveDown(0.5);
      });
    }

    doc.end();

    // Wait for the writable stream buffer to finish filling
    await new Promise<void>((resolve, reject) => {
      writableStreamBuffer.on("finish", resolve);
      writableStreamBuffer.on("error", reject);
    });

    const pdfBuffer = writableStreamBuffer.getContents();
    if (!pdfBuffer) throw new InternalServerError("Failed to generate PDF");
    return Buffer.from(pdfBuffer);
  },
};

export default reportService;
