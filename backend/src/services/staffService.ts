import bcrypt from "bcrypt";
import User from "../models/User.js";
import { ROLES } from "../config/roles.js";
import { BadRequestError, NotFoundError } from "../utils/exceptions.js";

const staffService = {
  list: async () => {
    return User.findAll({
      where: { role: ROLES.STAFF },
      attributes: ["id", "username", "role", "isActive", "createdAt"],
    });
  },

  create: async ({ username, password }) => {
    const existing = await User.findOne({ where: { username } });
    if (existing) throw new BadRequestError("Username already exists");
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      role: ROLES.STAFF,
    });
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  },

  update: async (id, payload) => {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    delete payload.fullName;
    await user.update(payload);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  },

  remove: async (id) => {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");
    await user.destroy();
    return true;
  },
};

export default staffService;
