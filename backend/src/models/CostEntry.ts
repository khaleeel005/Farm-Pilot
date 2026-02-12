import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

// Define cost type enum
export const CostTypes = {
  SUPERVISOR_SALARY: "supervisor_salary",
  LABORER_SALARY: "laborer_salary",
  ELECTRICITY: "electricity",
  WATER: "water",
  MAINTENANCE: "maintenance",
  FEED: "feed",
  MEDICATION: "medication",
  TRANSPORTATION: "transportation",
  EQUIPMENT: "equipment",
  UTILITIES: "utilities",
  SUPPLIES: "supplies",
  REPAIRS: "repairs",
  FUEL: "fuel",
  SECURITY: "security",
  CLEANING: "cleaning",
  CONSULTING: "consulting",
  OTHER: "other",
};

const CostEntry = sequelize.define(
  "CostEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    costType: {
      type: DataTypes.ENUM(...Object.values(CostTypes)),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    category: {
      type: DataTypes.ENUM("operational", "capital", "emergency"),
      defaultValue: "operational",
    },
    paymentMethod: {
      type: DataTypes.ENUM(
        "cash",
        "bank_transfer",
        "check",
        "card",
        "mobile_money"
      ),
      allowNull: true,
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    houseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        name: "cost_entries_date_cost_type",
        fields: ["date", "cost_type"],
      },
      {
        name: "cost_entries_house_id",
        fields: ["house_id"],
      },
      {
        name: "cost_entries_created_by",
        fields: ["created_by"],
      },
    ],
  }
);

export default CostEntry;
