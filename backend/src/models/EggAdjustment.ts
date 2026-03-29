import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const EggAdjustment = sequelize.define("EggAdjustment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Positive for addition (e.g., set opening balance), negative for deduction (e.g., loss, giving away)",
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default EggAdjustment;
