import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const Laborer = sequelize.define("Laborer", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.STRING(20), unique: true },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  monthlySalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  hireDate: { type: DataTypes.DATEONLY },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  emergencyContact: { type: DataTypes.STRING(100) },
  emergencyPhone: { type: DataTypes.STRING(20) },
});

export default Laborer;
