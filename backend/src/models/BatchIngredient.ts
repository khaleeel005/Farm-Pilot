import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const BatchIngredient = sequelize.define("BatchIngredient", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ingredientName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantityKg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costPerKg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  supplier: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
});

export default BatchIngredient;
