import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const DailyLog = sequelize.define("DailyLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  logDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  houseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  eggsCollected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  crackedEggs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  feedBatchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  feedBagsUsed: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    defaultValue: 0,
  },
  mortalityCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  supervisorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default DailyLog;
