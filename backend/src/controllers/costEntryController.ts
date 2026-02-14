import costEntryService from "../services/costEntryService.js";
import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../utils/exceptions.js";
import { queryFloat, queryInt, queryString } from "../utils/parsers.js";
import type {
  CostEntryFiltersInput,
  CostSummaryFiltersInput,
} from "../types/dto.js";

const parseIdParam = (id: string | undefined): number => {
  const parsed = Number.parseInt(id ?? "", 10);
  if (Number.isNaN(parsed)) {
    throw new BadRequestError("Invalid id parameter");
  }
  return parsed;
};

class CostEntryController {
  async createCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const costEntry = await costEntryService.createCostEntry(
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Cost entry created successfully",
        data: costEntry,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCostEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        startDate: queryString(req.query.startDate),
        endDate: queryString(req.query.endDate),
        costType: queryString(req.query.costType) as
          | CostEntryFiltersInput["costType"]
          | undefined,
        category: queryString(req.query.category) as
          | CostEntryFiltersInput["category"]
          | undefined,
        houseId: queryInt(req.query.houseId),
        createdBy: queryInt(req.query.createdBy),
        minAmount: queryFloat(req.query.minAmount),
        maxAmount: queryFloat(req.query.maxAmount),
      };

      const pagination = {
        page: queryInt(req.query.page) ?? 1,
        limit: queryInt(req.query.limit) ?? 50,
      };

      const result = await costEntryService.getCostEntries(filters, pagination);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get cost entry by ID
  async getCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseIdParam(req.params.id);
      const costEntry = await costEntryService.getCostEntryById(id);

      res.status(200).json({
        success: true,
        data: costEntry,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update cost entry
  async updateCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseIdParam(req.params.id);
      const userId = req.user?.id;
      const costEntry = await costEntryService.updateCostEntry(
        id,
        req.body,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Cost entry updated successfully",
        data: costEntry,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete cost entry
  async deleteCostEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseIdParam(req.params.id);
      const result = await costEntryService.deleteCostEntry(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get cost summary
  async getCostSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        startDate: queryString(req.query.startDate),
        endDate: queryString(req.query.endDate),
        groupBy: (queryString(req.query.groupBy) || "month") as CostSummaryFiltersInput["groupBy"],
        houseId: queryInt(req.query.houseId),
      };

      const summary = await costEntryService.getCostSummary(filters);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available cost types
  async getCostTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const costTypes = costEntryService.getCostTypes();

      res.status(200).json({
        success: true,
        data: costTypes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CostEntryController();
