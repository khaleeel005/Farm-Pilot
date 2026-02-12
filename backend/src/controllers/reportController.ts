import reportService from "../services/reportService.js";

const reportController = {
  production: async (req, res, next) => {
    try {
      const { start, end } = req.query;
      const data = await reportService.getProductionReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  sales: async (req, res, next) => {
    try {
      const { start, end } = req.query;
      const data = await reportService.getSalesReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  financial: async (req, res, next) => {
    try {
      const { start, end } = req.query;
      const data = await reportService.getFinancialReport(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  export: async (req, res, next) => {
    try {
      const type = req.params.type;
      const { format } = req.query;
      const { start, end } = req.query;

      if (!format || !["csv", "pdf"].includes(format)) {
        return res
          .status(400)
          .json({ success: false, message: "format query must be csv or pdf" });
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
