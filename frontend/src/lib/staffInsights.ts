import { getTodayIsoDate } from "@/lib/dailyLogs";
import type { DailyLog, WorkAssignment } from "@/types";

export interface TaskItem {
  id: number;
  task: string;
  status: "completed" | "pending" | "in-progress";
  time: string;
}

export interface DailyStats {
  eggsCollected: number;
  feedBagsUsed: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface DailyPerformance {
  day: string;
  date: string;
  eggs: number;
  feed: number;
  tasks: number;
  totalTasks: number;
  efficiency: number;
}

export interface WeeklyStats {
  eggsCollected: number;
  feedDistributed: number;
  tasksCompleted: number;
  totalTasks: number;
  avgCollectionTime: string;
  efficiency: number;
}

export interface StaffDashboardOverviewData {
  todaysTasks: TaskItem[];
  stats: DailyStats;
}

export interface StaffPerformanceData {
  weeklyStats: WeeklyStats;
  dailyPerformance: DailyPerformance[];
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONDAY_FIRST_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function toDateValue(date: Date) {
  return date.toISOString().split("T")[0];
}

function getAssignmentDateValue(assignment: WorkAssignment) {
  return (assignment.date || assignment.createdAt || "").split("T")[0];
}

function buildTaskItem(assignment: WorkAssignment): TaskItem {
  return {
    id: assignment.id,
    task:
      assignment.tasksAssigned?.join(", ") ||
      assignment.performanceNotes ||
      "Assigned task",
    status:
      assignment.attendanceStatus === "present"
        ? "completed"
        : assignment.attendanceStatus === "late"
          ? "in-progress"
          : "pending",
    time: assignment.hours ? `${assignment.hours} hours` : "Anytime",
  };
}

export function getCurrentWeekRange(today = new Date()) {
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    monday,
    sunday,
    startDate: toDateValue(monday),
    endDate: toDateValue(sunday),
  };
}

export function buildStaffDashboardOverview(
  logs: DailyLog[],
  assignments: WorkAssignment[],
  todayIsoDate = getTodayIsoDate(),
): StaffDashboardOverviewData {
  const todaysTasks = assignments
    .filter((assignment) => getAssignmentDateValue(assignment) === todayIsoDate)
    .map(buildTaskItem);

  const completedTasks = todaysTasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    todaysTasks,
    stats: {
      eggsCollected: logs.reduce(
        (sum, log) => sum + (Number(log.eggsCollected) || 0),
        0,
      ),
      feedBagsUsed: logs.reduce(
        (sum, log) => sum + (Number(log.feedBagsUsed) || 0),
        0,
      ),
      tasksCompleted: completedTasks,
      totalTasks: todaysTasks.length,
    },
  };
}

export function buildStaffPerformanceData(
  logs: DailyLog[],
  assignments: WorkAssignment[],
  today = new Date(),
): StaffPerformanceData {
  const { monday } = getCurrentWeekRange(today);
  const dailyData = new Map<string, { eggs: number; feed: number; date: string }>();
  const tasksByDay = new Map<string, { completed: number; total: number }>();

  for (let index = 0; index < 7; index += 1) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);
    const dateValue = toDateValue(currentDate);

    dailyData.set(dateValue, { eggs: 0, feed: 0, date: dateValue });
    tasksByDay.set(dateValue, { completed: 0, total: 4 });
  }

  logs.forEach((log) => {
    const currentDay = dailyData.get(log.logDate);

    if (currentDay) {
      currentDay.eggs += Number(log.eggsCollected) || 0;
      currentDay.feed += (Number(log.feedBagsUsed) || 0) * 25;
    }
  });

  assignments.forEach((assignment) => {
    const assignmentDate = getAssignmentDateValue(assignment);
    const currentDay = tasksByDay.get(assignmentDate);

    if (currentDay) {
      currentDay.total += 1;

      if (assignment.attendanceStatus === "present") {
        currentDay.completed += 1;
      }
    }
  });

  const dailyPerformance = Array.from(dailyData.entries())
    .map(([dateValue, dayData]) => {
      const date = new Date(dateValue);
      const tasks = tasksByDay.get(dateValue) || { completed: 0, total: 4 };
      const efficiency =
        tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

      return {
        day: DAY_NAMES[date.getDay()],
        date: dayData.date,
        eggs: dayData.eggs,
        feed: dayData.feed,
        tasks: tasks.completed,
        totalTasks: tasks.total,
        efficiency,
      };
    })
    .sort(
      (left, right) =>
        MONDAY_FIRST_ORDER.indexOf(left.day) -
        MONDAY_FIRST_ORDER.indexOf(right.day),
    );

  const weeklyStats = {
    eggsCollected: dailyPerformance.reduce((sum, day) => sum + day.eggs, 0),
    feedDistributed: dailyPerformance.reduce((sum, day) => sum + day.feed, 0),
    tasksCompleted: dailyPerformance.reduce((sum, day) => sum + day.tasks, 0),
    totalTasks: dailyPerformance.reduce(
      (sum, day) => sum + day.totalTasks,
      0,
    ),
    avgCollectionTime:
      dailyPerformance.reduce((sum, day) => sum + day.eggs, 0) > 0
        ? "~45 min"
        : "-",
    efficiency:
      dailyPerformance.length > 0
        ? Math.round(
            dailyPerformance.reduce(
              (sum, day) => sum + day.efficiency,
              0,
            ) / dailyPerformance.length,
          )
        : 0,
  };

  return {
    weeklyStats,
    dailyPerformance,
  };
}
