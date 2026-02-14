import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ROLES } from "../config/roles.js";
import { BadRequestError, NotFoundError } from "../utils/exceptions.js";
import type { StaffCreateInput, StaffUpdateInput } from "../types/dto.js";
import type { UserEntity } from "../types/entities.js";
import { asEntity, asEntities } from "../utils/modelHelpers.js";

const staffService = {
  list: async () => {
    return asEntities<UserEntity>(
      await User.findAll({
      where: { role: ROLES.STAFF },
      attributes: ["id", "username", "role", "isActive", "createdAt"],
    }),
    );
  },

  create: async ({ username, password }: StaffCreateInput) => {
    const existing = await User.findOne({ where: { username } });
    if (existing) throw new BadRequestError("Username already exists");
    const hash = await bcrypt.hash(password, 10);
    const user = asEntity<UserEntity>(await User.create({
      username,
      password: hash,
      role: ROLES.STAFF,
    }));
    if (!user) {
      throw new BadRequestError("Failed to create user");
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  },

  update: async (id: string | number | undefined, payload: StaffUpdateInput) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("User id is required");
    }
    const user = asEntity<UserEntity>(await User.findByPk(id));
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

  remove: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("User id is required");
    }
    const user = asEntity<UserEntity>(await User.findByPk(id));
    if (!user) throw new NotFoundError("User not found");
    await user.destroy();
    return true;
  },
};

export default staffService;
