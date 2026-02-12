import authService from "../services/authService.js";
import { validationResult } from "express-validator";

const authController = {
  /**
   * Login a user and return a JWT token.
   */
  login: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(
        username,
        password
      );

      res.status(200).json({
        success: true,
        token: accessToken,
        data: {
          user,
        },
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user information.
   */
  getCurrentUser: async (req, res, next) => {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout a user (invalidate token if applicable).
   */
  logout: (req, res) => {
    // Token invalidation logic can be added here if using a token blacklist.
    res.status(200).json({ success: true, message: "Logged out successfully" });
  },

  /**
   * Refresh the JWT token.
   */
  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const newToken = await authService.refreshToken(refreshToken);

      res.status(200).json({ success: true, token: newToken });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
