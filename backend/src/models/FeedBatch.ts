import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const FeedBatch = sequelize.define("FeedBatch", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  batchDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  batchName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  totalQuantityTons: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: false,
  },
  bagSizeKg: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    defaultValue: 50.0,
  },
  totalBags: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  costPerBag: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costPerKg: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  miscellaneousCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment:
      "Additional expenses like labor, transport, milling, packaging, etc.",
  },
});

export default FeedBatch;
