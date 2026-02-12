import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import config from "../config/auth.js";
import { UnauthorizedError, BadRequestError } from "../utils/exceptions.js";

const authService = {
  login: async (username, password) => {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const accessToken = jwt.sign(
      { id: user.id, role: String(user.role).toLowerCase() },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: String(user.role).toLowerCase() },
      config.JWT_SECRET,
      {
        expiresIn: "7d", // Refresh token valid for 7 days
      }
    );

    // Return user data without password
    const userData = {
      id: user.id,
      username: user.username,
      role: String(user.role).toLowerCase(),
      email: user.email,
      createdAt: user.createdAt,
    };

    return { user: userData, accessToken, refreshToken };
  },

  getCurrentUser: async (userId) => {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      role: String(user.role).toLowerCase(),
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  refreshToken: async (refreshToken) => {
    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    try {
      const payload = jwt.verify(refreshToken, config.JWT_SECRET);
      const newToken = jwt.sign(
        { id: payload.id, role: String(payload.role).toLowerCase() },
        config.JWT_SECRET,
        {
          expiresIn: config.JWT_EXPIRES_IN,
        }
      );

      return newToken;
    } catch (error) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  },
};

export default authService;
