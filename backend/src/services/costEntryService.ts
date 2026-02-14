import {
  ForeignKeyConstraintError,
  Op,
  ValidationError,
  type Model,
} from "sequelize";
import CostEntry, { CostTypes } from "../models/CostEntry.js";
import House from "../models/House.js";
import User from "../models/User.js";
import {
  BadRequestError,
  CustomError,
  InternalServerError,
  NotFoundError,
} from "../utils/exceptions.js";
import type {
  CostEntryFiltersInput,
  CostEntryPaginationInput,
  CostSummaryFiltersInput,
} from "../types/dto.js";
import type { CostEntryEntity, HouseEntity, UserEntity } from "../types/entities.js";

type CostEntryWithRelations = CostEntryEntity & {
  house?: (HouseEntity & { name?: string }) | null;
  creator?: Pick<UserEntity, "id" | "username"> | null;
};

type CostDateWhere = {
  [Op.gte]?: string;
  [Op.lte]?: string;
};

type CostAmountWhere = {
  [Op.gte]?: number;
  [Op.lte]?: number;
};

type CostEntryWhereClause = {
  date?: CostDateWhere;
  costType?: CostEntryEntity["costType"];
  category?: CostEntryEntity["category"];
  houseId?: number;
  createdBy?: number;
  amount?: CostAmountWhere;
};

type CostEntrySummaryModel = Model & {
  getDataValue: (key: "totalAmount" | "totalEntries" | "averageAmount") =>
    | string
    | number
    | null;
};

const COST_ENTRY_MUTABLE_FIELDS = [
  "date",
  "costType",
  "description",
  "amount",
  "category",
  "paymentMethod",
  "vendor",
  "receiptNumber",
  "notes",
  "houseId",
] as const;

type CostEntryMutableField = (typeof COST_ENTRY_MUTABLE_FIELDS)[number];
type CostEntryWritePayload = Partial<Pick<CostEntryEntity, CostEntryMutableField>>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCostEntryHouse(entry: CostEntryWithRelations): CostEntryWithRelations {
  if (entry.house?.houseName && !entry.house.name) {
    return {
      ...entry,
      house: {
        ...entry.house,
        name: entry.house.houseName,
      },
    };
  }
  return entry;
}

function toCostEntryWithRelations(model: Model): CostEntryWithRelations {
  return model.toJSON() as CostEntryWithRelations;
}

function pickCostEntryPayload(input: Partial<CostEntryEntity>): CostEntryWritePayload {
  const payload: CostEntryWritePayload = {};
  const mutablePayload = payload as Record<CostEntryMutableField, unknown>;

  for (const field of COST_ENTRY_MUTABLE_FIELDS) {
    const value = input[field];
    if (value !== undefined) {
      mutablePayload[field] = value;
    }
  }

  return payload;
}

function mapAndThrowCostEntryError(error: unknown, contextMessage: string): never {
  if (error instanceof CustomError) {
    throw error;
  }

  if (error instanceof ValidationError || error instanceof ForeignKeyConstraintError) {
    throw new BadRequestError(error.message);
  }

  if (error instanceof Error) {
    throw new InternalServerError(`${contextMessage}: ${error.message}`);
  }

  throw new InternalServerError(contextMessage);
}

class CostEntryService {
  async createCostEntry(costData: Partial<CostEntryEntity>, userId?: number) {
    const payload = pickCostEntryPayload(costData);

    try {
      const created = await CostEntry.create({
        ...payload,
        createdBy: userId,
      });

      const createdId = Number(created.getDataValue("id"));
      return await this.getCostEntryById(createdId);
    } catch (error: unknown) {
      mapAndThrowCostEntryError(error, "Failed to create cost entry");
    }
  }

  async getCostEntryById(id: number) {
    const costEntryModel = await CostEntry.findByPk(id, {
      include: [
        {
          model: House,
          as: "house",
          attributes: ["id", "houseName", "location"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!costEntryModel) {
      throw new NotFoundError("Cost entry not found");
    }

    return normalizeCostEntryHouse(toCostEntryWithRelations(costEntryModel));
  }

  async getCostEntries(
    filters: CostEntryFiltersInput = {},
    pagination: CostEntryPaginationInput = {},
  ) {
    const {
      startDate,
      endDate,
      costType,
      category,
      houseId,
      createdBy,
      minAmount,
      maxAmount,
    } = filters;

    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const whereClause: CostEntryWhereClause = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = startDate;
      if (endDate) whereClause.date[Op.lte] = endDate;
    }

    if (costType) whereClause.costType = costType;
    if (category) whereClause.category = category;
    if (houseId) whereClause.houseId = houseId;
    if (createdBy) whereClause.createdBy = createdBy;

    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {};
      if (minAmount !== undefined) whereClause.amount[Op.gte] = minAmount;
      if (maxAmount !== undefined) whereClause.amount[Op.lte] = maxAmount;
    }

    const { rows, count: total } = await CostEntry.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: House,
          as: "house",
          attributes: ["id", "houseName", "location"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
    });

    const costEntries = rows.map((row) =>
      normalizeCostEntryHouse(toCostEntryWithRelations(row)),
    );

    return {
      costEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCostEntry(
    id: number,
    updateData: Partial<CostEntryEntity>,
    _userId?: number,
  ) {
    const payload = pickCostEntryPayload(updateData);

    if (Object.keys(payload).length === 0) {
      throw new BadRequestError("No valid fields provided for update");
    }

    const costEntry = await CostEntry.findByPk(id);

    if (!costEntry) {
      throw new NotFoundError("Cost entry not found");
    }

    try {
      await costEntry.update(payload);
      return await this.getCostEntryById(id);
    } catch (error: unknown) {
      mapAndThrowCostEntryError(error, "Failed to update cost entry");
    }
  }

  async deleteCostEntry(id: number) {
    const costEntry = await CostEntry.findByPk(id);

    if (!costEntry) {
      throw new NotFoundError("Cost entry not found");
    }

    await costEntry.destroy();
    return { message: "Cost entry deleted successfully" };
  }

  async getCostSummary(filters: CostSummaryFiltersInput = {}) {
    const {
      startDate,
      endDate,
      groupBy: _groupBy = "month",
      houseId,
    } = filters;

    const whereClause: CostEntryWhereClause = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = startDate;
      if (endDate) whereClause.date[Op.lte] = endDate;
    }

    if (houseId) whereClause.houseId = houseId;

    const sequelize = CostEntry.sequelize;
    if (!sequelize) {
      throw new InternalServerError(
        "Sequelize instance not available for CostEntry model",
      );
    }

    const costTypeField =
      (CostEntry.rawAttributes.costType &&
        CostEntry.rawAttributes.costType.field) ||
      "cost_type";
    const amountField =
      (CostEntry.rawAttributes.amount &&
        CostEntry.rawAttributes.amount.field) ||
      "amount";

    const costsByType = await CostEntry.findAll({
      where: whereClause,
      attributes: [
        [sequelize.col(costTypeField), "costType"],
        [sequelize.fn("SUM", sequelize.col(amountField)), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "entryCount"],
      ],
      group: [sequelize.col(costTypeField)],
      order: [[sequelize.fn("SUM", sequelize.col(amountField)), "DESC"]],
    });

    const categoryField =
      (CostEntry.rawAttributes.category &&
        CostEntry.rawAttributes.category.field) ||
      "category";

    const costsByCategory = await CostEntry.findAll({
      where: whereClause,
      attributes: [
        [sequelize.col(categoryField), "category"],
        [sequelize.fn("SUM", sequelize.col(amountField)), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "entryCount"],
      ],
      group: [sequelize.col(categoryField)],
      order: [[sequelize.fn("SUM", sequelize.col(amountField)), "DESC"]],
    });

    const totalSummary = (await CostEntry.findOne({
      where: whereClause,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalEntries"],
        [sequelize.fn("AVG", sequelize.col("amount")), "averageAmount"],
      ],
    })) as CostEntrySummaryModel | null;

    return {
      costsByType: costsByType.map((item) => ({
        costType: item.getDataValue("costType") || null,
        totalAmount: toNumber(item.getDataValue("totalAmount")),
        entryCount: Math.trunc(toNumber(item.getDataValue("entryCount"))),
      })),
      costsByCategory: costsByCategory.map((item) => ({
        category: item.getDataValue("category") || null,
        totalAmount: toNumber(item.getDataValue("totalAmount")),
        entryCount: Math.trunc(toNumber(item.getDataValue("entryCount"))),
      })),
      totalSummary: {
        totalAmount: toNumber(totalSummary?.getDataValue("totalAmount")),
        totalEntries: Math.trunc(toNumber(totalSummary?.getDataValue("totalEntries"))),
        averageAmount: toNumber(totalSummary?.getDataValue("averageAmount")),
      },
    };
  }

  getCostTypes() {
    return Object.entries(CostTypes).map(([key, value]) => ({
      key,
      value,
      label: key
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  }
}

export default new CostEntryService();
