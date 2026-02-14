import { validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";
import staffService from "../services/staffService.js";

const staffController = {
  listStaff: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await staffService.list();
      res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  },

  createStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password } = req.body;
      const user = await staffService.create({ username, password });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  updateStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const payload = req.body;
      const updated = await staffService.update(id, payload);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  deleteStaff: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await staffService.remove(id);
      res.json({ success: true, message: "Staff deleted" });
    } catch (err) {
      next(err);
    }
  },
};

export default staffController;
