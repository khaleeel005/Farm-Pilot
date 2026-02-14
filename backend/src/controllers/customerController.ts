import customerService from "../services/customerService.js";
import type { NextFunction, Request, Response } from "express";

const customerController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customers = await customerService.getAllCustomers(req.query);
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await customerService.updateCustomer(
        req.params.id,
        req.body
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerService.deleteCustomer(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default customerController;
