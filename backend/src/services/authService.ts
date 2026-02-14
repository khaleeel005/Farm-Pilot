import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/auth.js";
import { UnauthorizedError, BadRequestError } from "../utils/exceptions.js";
import type { UserEntity } from "../types/entities.js";
import { asEntity } from "../utils/modelHelpers.js";

type JwtTokenPayload = JwtPayload & {
  id: number;
  role: string;
};

const jwtSecret: Secret = config.JWT_SECRET;
const jwtRefreshSecret: Secret = config.JWT_REFRESH_SECRET;
const accessTokenExpiresIn = config.JWT_EXPIRES_IN as SignOptions["expiresIn"];
const refreshTokenExpiresIn = config.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];

const authService = {
  login: async (username: string, password: string) => {
    const user = asEntity<UserEntity>(
      await User.findOne({ where: { username } }),
    );

    if (!user) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const accessToken = jwt.sign(
      { id: user.id, role: String(user.role).toLowerCase() },
      jwtSecret,
      {
        expiresIn: accessTokenExpiresIn,
      }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: String(user.role).toLowerCase() },
      jwtRefreshSecret,
      {
        expiresIn: refreshTokenExpiresIn,
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

  getCurrentUser: async (userId: number) => {
    const user = asEntity<UserEntity>(await User.findByPk(userId));

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

  refreshToken: async (refreshToken: string) => {
    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    try {
      const payload = jwt.verify(refreshToken, jwtRefreshSecret);
      if (typeof payload === "string" || payload.id === undefined || payload.role === undefined) {
        throw new UnauthorizedError("Invalid refresh token payload");
      }

      const parsedPayload = payload as JwtTokenPayload;
      const newToken = jwt.sign(
        { id: parsedPayload.id, role: String(parsedPayload.role).toLowerCase() },
        jwtSecret,
        {
          expiresIn: accessTokenExpiresIn,
        }
      );

      return newToken;
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  },
};

export default authService;
