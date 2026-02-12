import DailyLog from "../models/DailyLog.js";
import Sales from "../models/Sales.js";
import OperatingCost from "../models/OperatingCost.js";
import { Op } from "sequelize";
import { Parser as CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";

const reportService = {
  getProductionReport: async (start, end) => {
    if (!start || !end) throw new Error("start and end are required");
    const logs = await DailyLog.findAll({
      where: { logDate: { [Op.between]: [start, end] } },
    });
    const totalEggs = logs.reduce((s, l) => s + (Number(l.eggsCollected) || 0), 0);
    const days = logs.length;
    const avgPerDay = days ? totalEggs / days : 0;
    return { start, end, days, totalEggs, avgPerDay, logs };
  },

  getSalesReport: async (start, end) => {
    if (!start || !end) throw new Error("start and end are required");
    const rows = await Sales.findAll({
      where: { saleDate: { [Op.between]: [start, end] } },
    });
    const totalAmount = rows.reduce(
      (s, r) => s + (Number(r.totalAmount) || 0),
      0
    );
    const totalEggs = rows.reduce(
      (s, r) => s + (Number(r.quantity) || 0),
      0
    );
    return { start, end, totalAmount, totalEggs, rows };
  },

  getFinancialReport: async (start, end) => {
    if (!start || !end) throw new Error("start and end are required");
    // Operating costs by month within range
    const ops = await OperatingCost.findAll({
      where: { monthYear: { [Op.between]: [start, end] } },
    });
    const totalOperating = ops.reduce(
      (s, o) => s + (Number(o.totalMonthlyCost) || 0),
      0
    );

    // Sales total
    const sales = await Sales.findAll({
      where: { saleDate: { [Op.between]: [start, end] } },
    });
    const totalSales = sales.reduce(
      (s, r) => s + (Number(r.totalAmount) || 0),
      0
    );

    return { start, end, totalOperating, totalSales, ops, sales };
  },

  exportReportCsv: async (type, start, end) => {
    let data = [];
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
        pricePerEgg: s.pricePerEgg,
        totalAmount: s.totalAmount,
      }));
    } else if (type === "financial") {
      const r = await reportService.getFinancialReport(start, end);
      data = r.ops.map((o) => ({
        monthYear: o.monthYear,
        totalMonthlyCost: o.totalMonthlyCost,
        supervisorSalary: o.supervisorSalary,
      }));
    } else {
      throw new Error("unsupported export type");
    }

    // Handle empty data case - json2csv throws error on empty arrays
    if (data.length === 0) {
      return ""; // Return empty CSV
    }

    const parser = new CsvParser();
    const csv = parser.parse(data);
    return csv;
  },

  exportReportPdf: async (type, start, end) => {
    // Build a simple PDF containing the report summary and table rows
    let title = "Report";
    let rows = [];

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
        pricePerEgg: s.pricePerEgg,
        totalAmount: s.totalAmount,
      }));
    } else if (type === "financial") {
      title = "Financial Report";
      const r = await reportService.getFinancialReport(start, end);
      rows = r.ops.map((o) => ({
        monthYear: o.monthYear,
        totalMonthlyCost: o.totalMonthlyCost,
        supervisorSalary: o.supervisorSalary,
      }));
    } else {
      throw new Error("unsupported export type");
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
      const headers = Object.keys(rows[0]);
      headers.forEach((h) => {
        doc
          .font("Helvetica-Bold")
          .text(h.toUpperCase(), { continued: true, width: 100 });
        doc.text(" ", { continued: true });
      });
      doc.moveDown(0.5);

      // Rows
      rows.forEach((r) => {
        Object.values(r).forEach((v) => {
          doc
            .font("Helvetica")
            .text(String(v), { continued: true, width: 100 });
          doc.text(" ", { continued: true });
        });
        doc.moveDown(0.5);
      });
    }

    doc.end();

    // Wait for the writable stream buffer to finish filling
    await new Promise((resolve, reject) => {
      writableStreamBuffer.on("finish", resolve);
      writableStreamBuffer.on("error", reject);
    });

    const pdfBuffer = writableStreamBuffer.getContents();
    if (!pdfBuffer) throw new Error("Failed to generate PDF");
    return Buffer.from(pdfBuffer);
  },
};

export default reportService;
