import Laborer from "../models/Laborer.js";
import WorkAssignment from "../models/WorkAssignment.js";
import Payroll from "../models/Payroll.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import { Op } from "sequelize";

const laborService = {
  // Laborer CRUD
  getAllLaborers: async () => {
    return Laborer.findAll();
  },

  createLaborer: async (data) => {
    if (!data.fullName) throw new BadRequestError("fullName is required");
    return Laborer.create(data);
  },

  updateLaborer: async (id, updates) => {
    const [count] = await Laborer.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Laborer not found");
    return Laborer.findByPk(id);
  },

  deleteLaborer: async (id) => {
    const deleted = await Laborer.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Laborer not found");
    return true;
  },

  // Work assignments
  getWorkAssignments: async (filters = {}) => {
    const where = {};
    if (filters.date) where.date = filters.date;
    if (filters.laborer) where.laborerId = Number(filters.laborer);
    return WorkAssignment.findAll({ where });
  },

  createWorkAssignment: async (data) => {
    if (!data.laborerId || !data.date)
      throw new BadRequestError("laborerId and date are required");
    // normalize single 'task' into tasksAssigned array
    const payload = { ...data };
    if (data.task && !data.tasksAssigned) payload.tasksAssigned = [data.task];
    return WorkAssignment.create(payload);
  },

  updateWorkAssignment: async (id, updates) => {
    const [count] = await WorkAssignment.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Work assignment not found");
    return WorkAssignment.findByPk(id);
  },

  // Payroll
  generatePayrollForMonth: async (monthYear) => {
    if (!monthYear) throw new BadRequestError("monthYear is required");

    // monthYear expected as YYYY-MM or YYYY-MM-DD; normalize to YYYY-MM
    const monthKey = monthYear.toString().slice(0, 7);
    const [year, month] = monthKey.split("-").map((v) => Number(v));

    // helper: count working days in the month (exclude Sundays)
    const getWorkingDaysInMonth = (y, m) => {
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

    const laborers = await Laborer.findAll();
    const created = [];
    for (const l of laborers) {
      const baseSalary = Number(l.monthlySalary || 0);

      // get assignments for the laborer in the month
      const start = `${monthKey}-01`;
      const end = `${monthKey}-${new Date(year, month, 0).getDate()}`;
      const assignments = await WorkAssignment.findAll({
        where: { laborerId: l.id, date: { [Op.between]: [start, end] } },
      });

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

      const p = await Payroll.create({
        monthYear: monthKey,
        laborerId: l.id,
        baseSalary: baseSalary,
        daysWorked: daysWorked,
        daysAbsent: daysAbsent,
        salaryDeductions: salaryDeductions,
        bonusAmount: bonusAmount,
        finalSalary: earnedSalary,
        paymentStatus: "pending",
      });
      created.push(p);
    }

    return created;
  },

  updatePayroll: async (id, updates) => {
    const [count] = await Payroll.update(updates, { where: { id } });
    if (!count) throw new NotFoundError("Payroll not found");
    return Payroll.findByPk(id);
  },

  getPayrollForMonth: async (monthYear) => {
    if (!monthYear) throw new BadRequestError("monthYear is required");
    return Payroll.findAll({ where: { monthYear } });
  },

  getPayrollSummary: async (year) => {
    if (!year) throw new BadRequestError("year is required");
    const rows = await Payroll.findAll({
      where: { monthYear: { [Symbol.for("like")]: `${year}-%` } },
    });
    // fallback simple summary
    const total = rows.reduce((acc, r) => acc + Number(r.finalSalary || 0), 0);
    return { year, totalPayroll: total };
  },
};

export default laborService;
