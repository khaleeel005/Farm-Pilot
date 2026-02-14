import reportService from "../services/reportService.js";
import type { NextFunction, Request, Response } from "express";
import { queryString } from "../utils/parsers.js";

const reportController = {
  production: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = queryString(req.query.start);
      const end = queryString(req.query.end);
      const data = await reportService.getProductionReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  sales: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = queryString(req.query.start);
      const end = queryString(req.query.end);
      const data = await reportService.getSalesReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  financial: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = queryString(req.query.start);
      const end = queryString(req.query.end);
      const data = await reportService.getFinancialReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  export: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type;
      const format = queryString(req.query.format);
      const start = queryString(req.query.start);
      const end = queryString(req.query.end);

      if (!format || !["csv", "pdf"].includes(format)) {
        res
          .status(400)
          .json({ success: false, message: "format query must be csv or pdf" });
        return;
      }

      if (format === "csv") {
        const csv = await reportService.exportReportCsv(type, start, end);
        res.setHeader("Content-Type", "text/csv");
        res.send(csv);
      } else {
        const pdfBuffer = await reportService.exportReportPdf(type, start, end);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${type}-report-${start}_to_${end}.pdf"`
        );
        res.send(pdfBuffer);
      }
    } catch (err) {
      next(err);
    }
  },
};

export default reportController;
