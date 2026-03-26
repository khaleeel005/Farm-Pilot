import House from "../models/House.js";
import logger from "../config/logger.js";
import { BadRequestError } from "../utils/exceptions.js";
import type { NextFunction, Request, Response } from "express";

type HouseWritePayload = {
  houseName?: string;
  capacity?: number;
  initialBirdCount?: number;
  currentBirdCount?: number;
  mortalityCount?: number;
  location?: string;
  description?: string;
  status?: "active" | "maintenance" | "inactive";
};

type HouseCountState = Required<
  Pick<HouseWritePayload, "initialBirdCount" | "currentBirdCount" | "mortalityCount">
>;

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
  const initialBirdCount = parseOptionalInteger(body.initialBirdCount);
  const initialBirdsAlias = parseOptionalInteger(body.initialBirds);
  const currentBirdCount = parseOptionalInteger(body.currentBirdCount);
  const currentBirdsAlias = parseOptionalInteger(body.currentBirds);
  const mortalityCount = parseOptionalInteger(body.mortalityCount);
  const mortalityAlias = parseOptionalInteger(body.mortality);
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
  if (initialBirdCount !== undefined || initialBirdsAlias !== undefined) {
    payload.initialBirdCount =
      initialBirdCount !== undefined ? initialBirdCount : initialBirdsAlias;
  }
  if (currentBirdCount !== undefined || currentBirdsAlias !== undefined) {
    payload.currentBirdCount =
      currentBirdCount !== undefined ? currentBirdCount : currentBirdsAlias;
  }
  if (mortalityCount !== undefined || mortalityAlias !== undefined) {
    payload.mortalityCount =
      mortalityCount !== undefined ? mortalityCount : mortalityAlias;
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

const validateHouseCounts = (counts: HouseCountState) => {
  const { initialBirdCount, currentBirdCount, mortalityCount } = counts;

  if (initialBirdCount < 0 || currentBirdCount < 0 || mortalityCount < 0) {
    throw new BadRequestError("House bird counts must be non-negative");
  }

  if (currentBirdCount > initialBirdCount) {
    throw new BadRequestError(
      "currentBirdCount cannot exceed initialBirdCount",
    );
  }

  if (mortalityCount > initialBirdCount) {
    throw new BadRequestError(
      "mortalityCount cannot exceed initialBirdCount",
    );
  }

  if (initialBirdCount - mortalityCount !== currentBirdCount) {
    throw new BadRequestError(
      "initialBirdCount must equal currentBirdCount plus mortalityCount",
    );
  }
};

const resolveCreateHouseCounts = (payload: HouseWritePayload): HouseCountState => {
  let initialBirdCount = payload.initialBirdCount;
  let currentBirdCount = payload.currentBirdCount;
  let mortalityCount = payload.mortalityCount;

  if (
    initialBirdCount === undefined &&
    currentBirdCount === undefined &&
    mortalityCount === undefined
  ) {
    return {
      initialBirdCount: 0,
      currentBirdCount: 0,
      mortalityCount: 0,
    };
  }

  if (initialBirdCount === undefined) {
    initialBirdCount = (currentBirdCount ?? 0) + (mortalityCount ?? 0);
  }

  if (currentBirdCount === undefined && mortalityCount === undefined) {
    currentBirdCount = initialBirdCount;
    mortalityCount = 0;
  } else if (currentBirdCount === undefined) {
    currentBirdCount = initialBirdCount - mortalityCount!;
  } else if (mortalityCount === undefined) {
    mortalityCount = initialBirdCount - currentBirdCount;
  }

  const counts: HouseCountState = {
    initialBirdCount,
    currentBirdCount,
    mortalityCount: mortalityCount ?? 0,
  };
  validateHouseCounts(counts);
  return counts;
};

const resolveUpdatedHouseCounts = (
  payload: HouseWritePayload,
  existing: HouseCountState,
): HouseCountState => {
  const hasInitial = payload.initialBirdCount !== undefined;
  const hasCurrent = payload.currentBirdCount !== undefined;
  const hasMortality = payload.mortalityCount !== undefined;

  if (!hasInitial && !hasCurrent && !hasMortality) {
    return existing;
  }

  const initialBirdCount = hasInitial
    ? payload.initialBirdCount!
    : existing.initialBirdCount;

  let currentBirdCount: number;
  let mortalityCount: number;

  if (hasCurrent && hasMortality) {
    currentBirdCount = payload.currentBirdCount!;
    mortalityCount = payload.mortalityCount!;
  } else if (hasCurrent) {
    currentBirdCount = payload.currentBirdCount!;
    mortalityCount = initialBirdCount - currentBirdCount;
  } else if (hasMortality) {
    mortalityCount = payload.mortalityCount!;
    currentBirdCount = initialBirdCount - mortalityCount;
  } else {
    mortalityCount = existing.mortalityCount;
    currentBirdCount = initialBirdCount - mortalityCount;
  }

  const counts = {
    initialBirdCount,
    currentBirdCount,
    mortalityCount,
  };
  validateHouseCounts(counts);
  return counts;
};

const houseController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = pickHousePayload(req.body as Record<string, unknown>);
      const counts = resolveCreateHouseCounts(payload);

      if (!payload.houseName) {
        throw new BadRequestError("House name is required");
      }

      const house = await House.create({
        ...payload,
        capacity: payload.capacity ?? 1000,
        ...counts,
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

      const existingHouse = await House.findByPk(id);
      if (!existingHouse) {
        res.status(404).json({ success: false, message: "House not found" });
        return;
      }

      const counts = resolveUpdatedHouseCounts(updates, {
        initialBirdCount: Number(existingHouse.get("initialBirdCount") ?? 0),
        currentBirdCount: Number(existingHouse.get("currentBirdCount") ?? 0),
        mortalityCount: Number(existingHouse.get("mortalityCount") ?? 0),
      });

      const [updatedCount] = await House.update(
        {
          ...updates,
          initialBirdCount: counts.initialBirdCount,
          currentBirdCount: counts.currentBirdCount,
          mortalityCount: counts.mortalityCount,
        },
        { where: { id } },
      );

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
