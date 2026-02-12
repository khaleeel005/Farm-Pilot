import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const Payroll = sequelize.define("Payroll", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  monthYear: { type: DataTypes.STRING(7), allowNull: false }, // e.g., 2025-08
  laborerId: { type: DataTypes.INTEGER, allowNull: false },
  baseSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  daysWorked: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  daysAbsent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  salaryDeductions: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  bonusAmount: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  finalSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  paymentDate: { type: DataTypes.DATEONLY },
  paymentStatus: {
    type: DataTypes.ENUM("pending", "paid"),
    defaultValue: "pending"
  },
  notes: { type: DataTypes.TEXT },
});

export default Payroll;
