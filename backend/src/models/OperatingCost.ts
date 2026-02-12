import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const OperatingCost = sequelize.define("OperatingCost", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  monthYear: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  supervisorSalary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalLaborerSalaries: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  electricityCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  waterCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  maintenanceCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  otherCosts: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalMonthlyCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
});

export default OperatingCost;
