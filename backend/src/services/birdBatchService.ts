import { Op, type Transaction } from "sequelize";
import BirdBatch from "../models/BirdBatch.js";
import House from "../models/House.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import { sequelize } from "../utils/database.js";
import type { BirdBatchEntity } from "../types/entities.js";
import type { BirdBatchCreateInput } from "../types/dto.js";

type BirdBatchRecord = BirdBatchEntity;

const asBirdBatch = (value: unknown): BirdBatchRecord | null =>
  value as BirdBatchRecord | null;

const BIRD_BATCH_ATTRIBUTES: string[] = [
  "id",
  "houseId",
  "batchName",
  "placedAt",
  "initialBirdCount",
  "currentBirdCount",
  "mortalityCount",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
];

async function ensureHouseExists(
  houseId: number,
  transaction?: Transaction,
): Promise<void> {
  const house = await House.findByPk(houseId, { transaction });
  if (!house) {
    throw new NotFoundError("House not found");
  }
}

async function getLatestBatchForHouse(
  houseId: number,
  transaction?: Transaction,
): Promise<BirdBatchRecord | null> {
  return asBirdBatch(
    await BirdBatch.findOne({
      where: { houseId },
      order: [
        ["placedAt", "DESC"],
        ["id", "DESC"],
      ],
      transaction,
    }),
  );
}

async function getActiveBatchForHouse(
  houseId: number,
  transaction?: Transaction,
): Promise<BirdBatchRecord | null> {
  return asBirdBatch(
    await BirdBatch.findOne({
      where: {
        houseId,
        status: "active",
      },
      order: [
        ["placedAt", "DESC"],
        ["id", "DESC"],
      ],
      transaction,
    }),
  );
}

async function getDisplayBatchForHouse(
  houseId: number,
  transaction?: Transaction,
): Promise<BirdBatchRecord | null> {
  const active = await getActiveBatchForHouse(houseId, transaction);
  if (active) {
    return active;
  }
  return getLatestBatchForHouse(houseId, transaction);
}

async function syncHouseCountsForHouse(
  houseId: number,
  transaction: Transaction,
): Promise<void> {
  const batch = await getDisplayBatchForHouse(houseId, transaction);

  await House.update(
    {
      initialBirdCount: batch ? Number(batch.initialBirdCount) : 0,
      currentBirdCount: batch ? Number(batch.currentBirdCount) : 0,
      mortalityCount: batch ? Number(batch.mortalityCount) : 0,
    },
    {
      where: { id: houseId },
      transaction,
    },
  );
}

async function resolveStatusForBatch(
  batch: BirdBatchRecord,
  nextCurrentBirdCount: number,
  transaction: Transaction,
): Promise<"active" | "completed"> {
  const otherActiveBatch = asBirdBatch(
    await BirdBatch.findOne({
      where: {
        houseId: batch.houseId,
        status: "active",
        id: {
          [Op.ne]: batch.id,
        },
      },
      transaction,
    }),
  );

  if (otherActiveBatch) {
    return batch.status;
  }

  return nextCurrentBirdCount > 0 ? "active" : "completed";
}

const birdBatchService = {
  listHouseBatches: async (houseIdInput: number | string | undefined) => {
    if (houseIdInput === undefined || houseIdInput === null || houseIdInput === "") {
      throw new BadRequestError("House id is required");
    }

    const houseId = Number(houseIdInput);
    if (Number.isNaN(houseId)) {
      throw new BadRequestError("House id must be a valid number");
    }

    await ensureHouseExists(houseId);

    return BirdBatch.findAll({
      where: { houseId },
      attributes: BIRD_BATCH_ATTRIBUTES,
      order: [
        ["placedAt", "DESC"],
        ["id", "DESC"],
      ],
    });
  },

  createHouseBatch: async (
    houseIdInput: number | string | undefined,
    data: BirdBatchCreateInput,
  ) => {
    if (houseIdInput === undefined || houseIdInput === null || houseIdInput === "") {
      throw new BadRequestError("House id is required");
    }

    const houseId = Number(houseIdInput);
    if (Number.isNaN(houseId)) {
      throw new BadRequestError("House id must be a valid number");
    }

    const initialBirdCount = Number(data.initialBirdCount);
    if (!Number.isInteger(initialBirdCount) || initialBirdCount < 0) {
      throw new BadRequestError("initialBirdCount must be a non-negative integer");
    }

    return sequelize.transaction(async (transaction) => {
      await ensureHouseExists(houseId, transaction);

      const activeBatch = await getActiveBatchForHouse(houseId, transaction);
      if (activeBatch && Number(activeBatch.currentBirdCount) > 0) {
        throw new BadRequestError(
          "This house already has an active bird batch. Complete it before adding a new one.",
        );
      }

      const created = asBirdBatch(
        await BirdBatch.create(
          {
            houseId,
            batchName: data.batchName,
            placedAt: data.placedAt,
            initialBirdCount,
            currentBirdCount: initialBirdCount,
            mortalityCount: 0,
            status: initialBirdCount > 0 ? "active" : "completed",
            notes: data.notes ?? null,
          },
          { transaction },
        ),
      );

      if (!created) {
        throw new BadRequestError("Failed to create bird batch");
      }

      await syncHouseCountsForHouse(houseId, transaction);

      return BirdBatch.findByPk(created.id, {
        transaction,
        attributes: BIRD_BATCH_ATTRIBUTES,
      });
    });
  },

  getActiveBatchForHouse,

  getDisplayBatchForHouse,

  resolveCurrentBatchIdForHouse: async (
    houseId: number,
    transaction: Transaction,
  ): Promise<number> => {
    const batch = await getActiveBatchForHouse(houseId, transaction);
    if (!batch) {
      throw new BadRequestError(
        "This house has no active bird batch. Add a batch before recording daily logs.",
      );
    }

    return Number(batch.id);
  },

  applyMortalityDeltaToBatch: async (
    birdBatchId: number,
    mortalityDelta: number,
    transaction: Transaction,
  ) => {
    if (!mortalityDelta) {
      return null;
    }

    const batch = asBirdBatch(
      await BirdBatch.findByPk(birdBatchId, {
        transaction,
        attributes: BIRD_BATCH_ATTRIBUTES,
      }),
    );

    if (!batch) {
      throw new NotFoundError("Bird batch not found");
    }

    const nextCurrentBirdCount = Number(batch.currentBirdCount) - mortalityDelta;
    const nextMortalityCount = Number(batch.mortalityCount) + mortalityDelta;

    if (nextCurrentBirdCount < 0) {
      throw new BadRequestError(
        `Mortality count exceeds the available birds in batch ${batch.batchName}.`,
      );
    }

    if (nextMortalityCount < 0) {
      throw new BadRequestError("Batch mortality count cannot be negative.");
    }

    const nextStatus = await resolveStatusForBatch(
      batch,
      nextCurrentBirdCount,
      transaction,
    );

    await BirdBatch.update(
      {
        currentBirdCount: nextCurrentBirdCount,
        mortalityCount: nextMortalityCount,
        status: nextStatus,
      },
      {
        where: { id: birdBatchId },
        transaction,
      },
    );

    await syncHouseCountsForHouse(Number(batch.houseId), transaction);

    return BirdBatch.findByPk(birdBatchId, {
      transaction,
      attributes: BIRD_BATCH_ATTRIBUTES,
    });
  },
};

export default birdBatchService;
