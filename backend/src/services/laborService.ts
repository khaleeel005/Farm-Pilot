import Laborer from "../models/Laborer.js";
import WorkAssignment from "../models/WorkAssignment.js";
import Payroll from "../models/Payroll.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import { Op } from "sequelize";
import type {
  LaborerEntity,
  PayrollEntity,
  WorkAssignmentEntity,
} from "../types/entities.js";
import type { LaborAssignmentFiltersInput } from "../types/dto.js";
import { asEntities } from "../utils/modelHelpers.js";

const laborService = {
  // Laborer CRUD
  getAllLaborers: async () => {
    return Laborer.findAll();
  },

  createLaborer: async (data: Partial<LaborerEntity>) => {
    if (!data.fullName) throw new BadRequestError("fullName is required");
    return Laborer.create(data);
  },

  updateLaborer: async (
    id: string | number | undefined,
    updates: Partial<LaborerEntity>,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Laborer id is required");
    }
    const [count] = await Laborer.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Laborer not found");
    return Laborer.findByPk(id);
  },

  deleteLaborer: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Laborer id is required");
    }
    const deleted = await Laborer.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Laborer not found");
    return true;
  },

  // Work assignments
  getWorkAssignments: async (filters: LaborAssignmentFiltersInput = {}) => {
    const where: {
      date?: string;
      laborerId?: number;
    } = {};
    if (filters.date) where.date = filters.date;
    if (filters.laborer) where.laborerId = Number(filters.laborer);
    return WorkAssignment.findAll({ where });
  },

  createWorkAssignment: async (
    data: Partial<WorkAssignmentEntity> & { task?: string },
  ) => {
    if (!data.laborerId || !data.date)
      throw new BadRequestError("laborerId and date are required");
    // normalize single 'task' into tasksAssigned array
    const payload = { ...data };
    if (data.task && !data.tasksAssigned) payload.tasksAssigned = [data.task];
    return WorkAssignment.create(payload);
  },

  updateWorkAssignment: async (
    id: string | number | undefined,
    updates: Partial<WorkAssignmentEntity>,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Work assignment id is required");
    }
    const [count] = await WorkAssignment.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Work assignment not found");
    return WorkAssignment.findByPk(id);
  },

  // Payroll
  generatePayrollForMonth: async (monthYear: string | undefined) => {
    if (!monthYear) throw new BadRequestError("monthYear is required");

    // monthYear expected as YYYY-MM or YYYY-MM-DD; normalize to YYYY-MM
    const monthKey = monthYear.toString().slice(0, 7);
    const [rawYear, rawMonth] = monthKey.split("-");
    const year = Number(rawYear ?? 0);
    const month = Number(rawMonth ?? 0);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestError("monthYear must be in YYYY-MM or YYYY-MM-DD format");
    }

    // helper: count working days in the month (exclude Sundays)
    const getWorkingDaysInMonth = (y: number, m: number) => {
      const d = new Date(y, m, 0); // last day
      const days = d.getDate();
      let count = 0;
      for (let i = 1; i <= days; i++) {
        const day = new Date(y, m - 1, i).getDay();
        if (day !== 0) count++; // exclude Sunday (0)
      }
      return count;
    };

    const workingDaysInMonth = getWorkingDaysInMonth(year, month);

    const laborers = asEntities<LaborerEntity>(await Laborer.findAll());
    const created: PayrollEntity[] = [];
    for (const l of laborers) {
      const baseSalary = Number(l.monthlySalary || 0);

      // get assignments for the laborer in the month
      const start = `${monthKey}-01`;
      const end = `${monthKey}-${new Date(year, month, 0).getDate()}`;
      const assignments = asEntities<WorkAssignmentEntity>(await WorkAssignment.findAll({
        where: { laborerId: l.id, date: { [Op.between]: [start, end] } },
      }));

      const daysPresent = assignments.filter(
        (a) => a.attendanceStatus === "present"
      ).length;
      const halfDays = assignments.filter(
        (a) => a.attendanceStatus === "half_day"
      ).length;
      const daysWorked = daysPresent + 0.5 * halfDays;
      const daysAbsent = Math.max(0, workingDaysInMonth - daysWorked);

      const dailySalary = workingDaysInMonth
        ? baseSalary / workingDaysInMonth
        : 0;
      const salaryDeductions =
        daysAbsent * dailySalary + halfDays * 0.5 * dailySalary;

      // simple bonus calc placeholder (can be replaced with real logic)
      const bonusAmount = 0;

      const earnedSalary = baseSalary - salaryDeductions + bonusAmount;

      const p = ((await Payroll.create({
        monthYear: monthKey,
        laborerId: l.id,
        baseSalary: baseSalary,
        daysWorked: daysWorked,
        daysAbsent: daysAbsent,
        salaryDeductions: salaryDeductions,
        bonusAmount: bonusAmount,
        finalSalary: earnedSalary,
        paymentStatus: "pending",
      })) as unknown) as PayrollEntity;
      created.push(p);
    }

    return created;
  },

  updatePayroll: async (
    id: string | number | undefined,
    updates: Partial<PayrollEntity>,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Payroll id is required");
    }
    const [count] = await Payroll.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Payroll not found");
    return Payroll.findByPk(id);
  },

  getPayrollForMonth: async (monthYear: string | undefined) => {
    if (!monthYear) throw new BadRequestError("monthYear is required");
    return Payroll.findAll({ where: { monthYear } });
  },

  getPayrollSummary: async (year: string | undefined) => {
    if (!year) throw new BadRequestError("year is required");
    const rows = asEntities<PayrollEntity>(
      await Payroll.findAll({
        where: { monthYear: { [Op.like]: `${year}-%` } },
      }),
    );
    // fallback simple summary
    const total = rows.reduce((acc, r) => acc + Number(r.finalSalary || 0), 0);
    return { year, totalPayroll: total };
  },
};

export default laborService;
