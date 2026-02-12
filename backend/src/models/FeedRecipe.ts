import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const FeedRecipe = sequelize.define("FeedRecipe", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  recipeName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  cornPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  soybeanPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  wheatBranPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  limestonePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  otherIngredients: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

export default FeedRecipe;
