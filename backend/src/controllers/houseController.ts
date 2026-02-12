import House from "../models/House.js";
import { BadRequestError } from "../utils/exceptions.js";

const houseController = {
  create: async (req, res, next) => {
    try {
      const {
        name,
        houseName,
        capacity,
        currentBirds,
        currentBirdCount,
        location,
        description,
        notes,
        status,
      } = req.body;

      const finalHouseName = name || houseName;
      if (!finalHouseName) throw new BadRequestError("House name is required");

      const house = await House.create({
        houseName: finalHouseName,
        capacity: capacity || 1000,
        currentBirdCount: currentBirds || currentBirdCount || 0,
        location,
        description: notes || description,
        status: status || "active",
      });

      res.status(201).json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const houses = await House.findAll();
      res.status(200).json({ success: true, data: houses });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const house = await House.findByPk(id);

      if (!house) {
        return res
          .status(404)
          .json({ success: false, message: "House not found" });
      }

      res.status(200).json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const [updatedCount] = await House.update(updates, { where: { id } });

      if (updatedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "House not found" });
      }

      const updatedHouse = await House.findByPk(id);
      res.status(200).json({ success: true, data: updatedHouse });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedCount = await House.destroy({ where: { id } });

      if (deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "House not found" });
      }

      console.log(`[${new Date().toISOString()}] Deleted house id=${id}`);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};

export default houseController;
