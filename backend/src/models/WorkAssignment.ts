import { DataTypes } from "sequelize";
import { sequelize } from "../utils/database.js";

const WorkAssignment = sequelize.define("WorkAssignment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  laborerId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  // tasksAssigned stored as JSON array of strings
  tasksAssigned: { type: DataTypes.JSON, allowNull: true },
  attendanceStatus: {
    type: DataTypes.ENUM("present", "absent", "half_day", "late"),
    defaultValue: "present",
  },
  performanceNotes: { type: DataTypes.TEXT, allowNull: true },
  hours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
});

export default WorkAssignment;
