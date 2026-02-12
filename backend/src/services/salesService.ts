import Sales from "../models/Sales.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";

const salesService = {
  createSale: async (data) => {
    // Ensure required fields
    if (!data.saleDate || !data.customerId) {
      throw new BadRequestError("saleDate and customerId are required");
    }

    // Compute totalAmount from quantity * pricePerEgg if not provided
    if (!data.totalAmount) {
      const quantity = Number(data.quantity || 0);
      const pricePerEgg = Number(data.pricePerEgg || 0);
      const computed = quantity * pricePerEgg;

      // If computed is 0 and no explicit totalAmount provided, allow zero sales
      data.totalAmount = Number.isFinite(computed) ? computed : 0;
    }

    const sale = await Sales.create(data);
    return sale;
  },

  getAllSales: async (filters = {}) => {
    const where = {};

    // Filter by date
    const date = filters.date || filters.saleDate;
    if (date) {
      where.saleDate = date;
    }

    // Filter by customer
    if (filters.customer || filters.customerId) {
      const customerId = Number(filters.customer || filters.customerId);
      if (!Number.isNaN(customerId)) where.customerId = customerId;
    }

    const sales = await Sales.findAll({ where });
    return sales;
  },

  getSaleById: async (id) => {
    const sale = await Sales.findByPk(id);
    if (!sale) throw new NotFoundError("Sale not found");
    return sale;
  },

  updateSale: async (id, updates) => {
    const [updatedCount] = await Sales.update(updates, { where: { id } });
    if (!updatedCount) throw new NotFoundError("Sale not found");
    const updated = await Sales.findByPk(id);
    return updated;
  },

  deleteSale: async (id) => {
    const deleted = await Sales.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Sale not found");
    return true;
  },
};

export default salesService;
