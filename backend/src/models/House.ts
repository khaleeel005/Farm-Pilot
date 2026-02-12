import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const House = sequelize.define("House", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  houseName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "Unnamed House",
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1000,
  },
  currentBirdCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("active", "maintenance", "inactive"),
    allowNull: false,
    defaultValue: "active",
  },
});

export default House;
