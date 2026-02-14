import Sales from "../models/Sales.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import type { SalesEntity } from "../types/entities.js";
import type { SalesFiltersInput, SalesUpdateInput } from "../types/dto.js";

const SALES_MUTABLE_FIELDS = [
  "saleDate",
  "customerId",
  "quantity",
  "pricePerEgg",
  "totalAmount",
  "paymentMethod",
  "paymentStatus",
  "supervisorId",
] as const;

type SalesMutableField = (typeof SALES_MUTABLE_FIELDS)[number];
type SalesWritePayload = Partial<Pick<SalesEntity, SalesMutableField>>;

const pickSalesPayload = (data: Partial<SalesEntity>): SalesWritePayload => {
  const payload: SalesWritePayload = {};
  const mutablePayload = payload as Record<SalesMutableField, unknown>;
  for (const field of SALES_MUTABLE_FIELDS) {
    const value = data[field];
    if (value !== undefined) {
      mutablePayload[field] = value;
    }
  }
  return payload;
};

const salesService = {
  createSale: async (data: Partial<SalesEntity>) => {
    const payload = pickSalesPayload(data);

    // Ensure required fields
    if (!payload.saleDate || !payload.customerId) {
      throw new BadRequestError("saleDate and customerId are required");
    }

    // Compute totalAmount from quantity * pricePerEgg if not provided
    if (payload.totalAmount === undefined || payload.totalAmount === null) {
      const quantity = Number(payload.quantity || 0);
      const pricePerEgg = Number(payload.pricePerEgg || 0);
      const computed = quantity * pricePerEgg;

      // If computed is 0 and no explicit totalAmount provided, allow zero sales
      payload.totalAmount = Number.isFinite(computed) ? computed : 0;
    }

    const sale = await Sales.create(payload);
    return sale;
  },

  getAllSales: async (filters: SalesFiltersInput = {}) => {
    const where: { saleDate?: string; customerId?: number } = {};

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

  getSaleById: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Sale id is required");
    }
    const sale = await Sales.findByPk(id);
    if (!sale) throw new NotFoundError("Sale not found");
    return sale;
  },

  updateSale: async (id: string | number | undefined, updates: SalesUpdateInput) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Sale id is required");
    }
    const payload = pickSalesPayload(updates);
    if (Object.keys(payload).length === 0) {
      throw new BadRequestError("No valid sale fields provided for update");
    }

    const existing = await Sales.findByPk(id);
    if (!existing) throw new NotFoundError("Sale not found");

    if (
      (payload.quantity !== undefined || payload.pricePerEgg !== undefined) &&
      (payload.totalAmount === undefined || payload.totalAmount === null)
    ) {
      const quantity = Number(payload.quantity ?? existing.getDataValue("quantity") ?? 0);
      const pricePerEgg = Number(payload.pricePerEgg ?? existing.getDataValue("pricePerEgg") ?? 0);
      const computed = quantity * pricePerEgg;
      payload.totalAmount = Number.isFinite(computed) ? computed : 0;
    }

    await existing.update(payload);
    const updated = await Sales.findByPk(id);
    return updated;
  },

  deleteSale: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Sale id is required");
    }
    const deleted = await Sales.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Sale not found");
    return true;
  },
};

export default salesService;
