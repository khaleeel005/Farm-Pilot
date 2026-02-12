import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const Sales = sequelize.define("Sales", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  saleDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  pricePerEgg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM("cash", "transfer", "check"),
    allowNull: false,
    defaultValue: "cash",
  },
  paymentStatus: {
    type: DataTypes.ENUM("paid", "pending"),
    allowNull: false,
    defaultValue: "pending",
  },
  supervisorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default Sales;
