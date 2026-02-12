import CostEntry, { CostTypes } from "../models/CostEntry.js";
import House from "../models/House.js";
import User from "../models/User.js";
import { Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../utils/exceptions.js";

class CostEntryService {
  // Create a new cost entry
  async createCostEntry(costData, userId) {
    try {
      const costEntry = await CostEntry.create({
        ...costData,
        createdBy: userId,
      });

      return await this.getCostEntryById(costEntry.id);
    } catch (error) {
      throw new Error(`Error creating cost entry: ${error.message}`);
    }
  }

  // Get cost entry by ID with associations
  async getCostEntryById(id) {
    try {
      const costEntry = await CostEntry.findByPk(id, {
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

      if (!costEntry) {
        throw new Error("Cost entry not found");
      }

      // Backwards compatibility: some callers expect house.name
      if (
        costEntry.house &&
        costEntry.house.houseName &&
        !costEntry.house.name
      ) {
        costEntry.house.name = costEntry.house.houseName;
      }

      return costEntry;
    } catch (error) {
      throw new Error(`Error fetching cost entry: ${error.message}`);
    }
  }

  // Get cost entries with filtering and pagination
  async getCostEntries(filters = {}, pagination = {}) {
    try {
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

      const whereClause = {};

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

      const { rows: costEntries, count: total } =
        await CostEntry.findAndCountAll({
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

      // Map included house.houseName to house.name for backward compatibility
      const mapped = costEntries.map((ce) => {
        if (ce.house && ce.house.houseName && !ce.house.name) {
          ce.house.name = ce.house.houseName;
        }
        return ce;
      });

      return {
        costEntries: mapped,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Error fetching cost entries: ${error.message}`);
    }
  }

  // Update cost entry
  async updateCostEntry(id, updateData, userId) {
    try {
      const costEntry = await CostEntry.findByPk(id);

      if (!costEntry) {
        throw new Error("Cost entry not found");
      }

      await costEntry.update(updateData);
      return await this.getCostEntryById(id);
    } catch (error) {
      throw new Error(`Error updating cost entry: ${error.message}`);
    }
  }

  async deleteCostEntry(id) {
    try {
      const costEntry = await CostEntry.findByPk(id);

      if (!costEntry) {
        throw new NotFoundError("Cost entry not found");
      }

      await costEntry.destroy();
      return { message: "Cost entry deleted successfully" };
    } catch (error) {
      throw new BadRequestError(`Error deleting cost entry: ${error.message}`);
    }
  }

  async getCostSummary(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        groupBy = "month", // 'day', 'week', 'month', 'year'
        houseId,
      } = filters;

      const whereClause = {};

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = startDate;
        if (endDate) whereClause.date[Op.lte] = endDate;
      }

      if (houseId) whereClause.houseId = houseId;

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
          [CostEntry.sequelize.col(costTypeField), "costType"],
          [
            CostEntry.sequelize.fn("SUM", CostEntry.sequelize.col(amountField)),
            "totalAmount",
          ],
          [
            CostEntry.sequelize.fn("COUNT", CostEntry.sequelize.col("id")),
            "entryCount",
          ],
        ],
        group: [CostEntry.sequelize.col(costTypeField)],
        order: [
          [
            CostEntry.sequelize.fn("SUM", CostEntry.sequelize.col(amountField)),
            "DESC",
          ],
        ],
      });

      const categoryField =
        (CostEntry.rawAttributes.category &&
          CostEntry.rawAttributes.category.field) ||
        "category";

      const costsByCategory = await CostEntry.findAll({
        where: whereClause,
        attributes: [
          [CostEntry.sequelize.col(categoryField), "category"],
          [
            CostEntry.sequelize.fn("SUM", CostEntry.sequelize.col(amountField)),
            "totalAmount",
          ],
          [
            CostEntry.sequelize.fn("COUNT", CostEntry.sequelize.col("id")),
            "entryCount",
          ],
        ],
        group: [CostEntry.sequelize.col(categoryField)],
        order: [
          [
            CostEntry.sequelize.fn("SUM", CostEntry.sequelize.col(amountField)),
            "DESC",
          ],
        ],
      });

      const totalSummary = await CostEntry.findOne({
        where: whereClause,
        attributes: [
          [
            CostEntry.sequelize.fn("SUM", CostEntry.sequelize.col("amount")),
            "totalAmount",
          ],
          [
            CostEntry.sequelize.fn("COUNT", CostEntry.sequelize.col("id")),
            "totalEntries",
          ],
          [
            CostEntry.sequelize.fn("AVG", CostEntry.sequelize.col("amount")),
            "averageAmount",
          ],
        ],
      });

      return {
        costsByType: costsByType.map((item) => ({
          costType: item.getDataValue("costType") || null,
          totalAmount: parseFloat(item.getDataValue("totalAmount") || 0),
          entryCount: parseInt(item.getDataValue("entryCount") || 0),
        })),
        costsByCategory: costsByCategory.map((item) => ({
          category: item.getDataValue("category") || null,
          totalAmount: parseFloat(item.getDataValue("totalAmount") || 0),
          entryCount: parseInt(item.getDataValue("entryCount") || 0),
        })),
        totalSummary: {
          totalAmount: parseFloat(
            totalSummary.getDataValue("totalAmount") || 0
          ),
          totalEntries: parseInt(
            totalSummary.getDataValue("totalEntries") || 0
          ),
          averageAmount: parseFloat(
            totalSummary.getDataValue("averageAmount") || 0
          ),
        },
      };
    } catch (error) {
      throw new Error(`Error generating cost summary: ${error.message}`);
    }
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
