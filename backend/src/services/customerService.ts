import Customer from "../models/Customer.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import type { CustomerFiltersInput } from "../types/dto.js";
import type { CustomerEntity } from "../types/entities.js";

const customerService = {
  createCustomer: async (data: Partial<CustomerEntity>) => {
    if (!data.customerName) {
      throw new BadRequestError("Customer name is required");
    }

    const customer = await Customer.create(data);
    return customer;
  },

  getAllCustomers: async (filters: CustomerFiltersInput = {}) => {
    const where: { isActive?: boolean } = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const customers = await Customer.findAll({ where });
    return customers;
  },

  getCustomerById: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Customer id is required");
    }
    const customer = await Customer.findByPk(id);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer;
  },

  updateCustomer: async (
    id: string | number | undefined,
    updates: Partial<CustomerEntity>,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Customer id is required");
    }
    const [updatedCount] = await Customer.update(updates, { where: { id } });
    if (!updatedCount) throw new NotFoundError("Customer not found");
    const updated = await Customer.findByPk(id);
    return updated;
  },

  deleteCustomer: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Customer id is required");
    }
    const deleted = await Customer.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Customer not found");
    return true;
  },
};

export default customerService;
