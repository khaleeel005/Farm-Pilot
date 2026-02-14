import House from "../models/House.js";
import logger from "../config/logger.js";
import { BadRequestError } from "../utils/exceptions.js";
import type { NextFunction, Request, Response } from "express";

type HouseWritePayload = {
  houseName?: string;
  capacity?: number;
  currentBirdCount?: number;
  location?: string;
  description?: string;
  status?: "active" | "maintenance" | "inactive";
};

const parseOptionalInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

const parseOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pickHousePayload = (body: Record<string, unknown>): HouseWritePayload => {
  const payload: HouseWritePayload = {};
  const houseName = parseOptionalString(body.houseName);
  const nameAlias = parseOptionalString(body.name);
  const capacity = parseOptionalInteger(body.capacity);
  const currentBirdCount = parseOptionalInteger(body.currentBirdCount);
  const currentBirdsAlias = parseOptionalInteger(body.currentBirds);
  const location = parseOptionalString(body.location);
  const description = parseOptionalString(body.description);
  const notesAlias = parseOptionalString(body.notes);
  const statusValue = body.status;

  if (houseName || nameAlias) {
    payload.houseName = houseName || nameAlias;
  }
  if (capacity !== undefined) {
    payload.capacity = capacity;
  }
  if (currentBirdCount !== undefined || currentBirdsAlias !== undefined) {
    payload.currentBirdCount =
      currentBirdCount !== undefined ? currentBirdCount : currentBirdsAlias;
  }
  if (location) {
    payload.location = location;
  }
  if (description || notesAlias) {
    payload.description = description || notesAlias;
  }
  if (
    statusValue === "active" ||
    statusValue === "maintenance" ||
    statusValue === "inactive"
  ) {
    payload.status = statusValue;
  }

  return payload;
};

const houseController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = pickHousePayload(req.body as Record<string, unknown>);

      if (!payload.houseName) {
        throw new BadRequestError("House name is required");
      }

      const house = await House.create({
        ...payload,
        capacity: payload.capacity ?? 1000,
        currentBirdCount: payload.currentBirdCount ?? 0,
        status: payload.status ?? "active",
      });

      res.status(201).json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const houses = await House.findAll();
      res.status(200).json({ success: true, data: houses });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const house = await House.findByPk(id);

      if (!house) {
        res.status(404).json({ success: false, message: "House not found" });
        return;
      }

      res.status(200).json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = pickHousePayload(req.body as Record<string, unknown>);
      if (Object.keys(updates).length === 0) {
        throw new BadRequestError("No valid house fields provided for update");
      }

      const [updatedCount] = await House.update(updates, { where: { id } });

      if (updatedCount === 0) {
        res.status(404).json({ success: false, message: "House not found" });
        return;
      }

      const updatedHouse = await House.findByPk(id);
      res.status(200).json({ success: true, data: updatedHouse });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deletedCount = await House.destroy({ where: { id } });

      if (deletedCount === 0) {
        res.status(404).json({ success: false, message: "House not found" });
        return;
      }

      logger.info(`Deleted house id=${id}`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export default houseController;
