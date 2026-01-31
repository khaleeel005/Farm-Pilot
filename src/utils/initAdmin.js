import { sequelize } from "./database.js";
import bcrypt from "bcrypt";
import User from "./src/models/User.js";

/**
 * Initialize admin user if it doesn't exist
 */
async function initializeAdmin() {
  try {
    await sequelize.authenticate();
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { username: "admin" } });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }
    
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    
    if (!username || !password) {
      throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      password: hashedPassword,
      role: "owner",
    });

    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error initializing admin user:", error);
    throw error;
  }
}

export { initializeAdmin };