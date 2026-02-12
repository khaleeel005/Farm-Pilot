import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const BirdCost = sequelize.define("BirdCost", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  batchDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  birdsPurchased: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  costPerBird: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  vaccinationCostPerBird: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
  },
  expectedLayingMonths: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
  },
});

export default BirdCost;
