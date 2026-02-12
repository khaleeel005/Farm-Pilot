import Customer from "../models/Customer.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";

const customerService = {
  createCustomer: async (data) => {
    if (!data.customerName) {
      throw new BadRequestError("Customer name is required");
    }

    const customer = await Customer.create(data);
    return customer;
  },

  getAllCustomers: async (filters = {}) => {
    const where = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === "true";
    }

    const customers = await Customer.findAll({ where });
    return customers;
  },

  getCustomerById: async (id) => {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new NotFoundError("Customer not found");
    return customer;
  },

  updateCustomer: async (id, updates) => {
    const [updatedCount] = await Customer.update(updates, { where: { id } });
    if (!updatedCount) throw new NotFoundError("Customer not found");
    const updated = await Customer.findByPk(id);
    return updated;
  },

  deleteCustomer: async (id) => {
    const deleted = await Customer.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Customer not found");
    return true;
  },
};

export default customerService;
