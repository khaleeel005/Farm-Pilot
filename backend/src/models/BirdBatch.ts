import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const BirdBatch = sequelize.define("BirdBatch", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  houseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  batchName: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  placedAt: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  initialBirdCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentBirdCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mortalityCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM("active", "completed"),
    allowNull: false,
    defaultValue: "active",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default BirdBatch;
