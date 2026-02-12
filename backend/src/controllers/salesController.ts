import salesService from "../services/salesService.js";

const salesController = {
  create: async (req, res, next) => {
    try {
      const sale = await salesService.createSale(req.body);
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const sales = await salesService.getAllSales(req.query);
      res.status(200).json({ success: true, data: sales });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const sale = await salesService.getSaleById(req.params.id);
      res.status(200).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const updated = await salesService.updateSale(req.params.id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      await salesService.deleteSale(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Sale deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default salesController;
