import type { User } from "@/types";

export interface StaffMember extends User {
  avatar?: string;
  department?: string;
  email?: string;
  fullName?: string;
  name?: string;
  performance?: number;
  phone?: string;
  salary?: string;
  status?: string;
  workersSupervised?: number;
}

export interface StaffFormData {
  password: string;
  username: string;
}

export interface StaffSummary {
  activeStaff: number;
  avgPerformance: number;
  inactiveStaff: number;
  payrollRecords: number;
  performanceRecordCount: number;
  totalPayroll: number;
  totalStaff: number;
}

export function createEmptyStaffForm(): StaffFormData {
  return {
    username: "",
    password: "",
  };
}

export function normalizeStaffMembers(value: unknown): StaffMember[] {
  if (Array.isArray(value)) {
    return value as StaffMember[];
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown[] }).data)
  ) {
    return (value as { data: StaffMember[] }).data;
  }

  return [];
}

export function buildCreateStaffPayload(formData: StaffFormData): StaffFormData {
  return {
    username: formData.username.trim(),
    password: formData.password.trim() || "changeme",
  };
}

export function getStaffDisplayName(staffMember: StaffMember): string {
  return (
    staffMember.fullName ||
    staffMember.name ||
    staffMember.username ||
    "Unknown"
  );
}

export function getStaffInitials(staffMember: StaffMember): string {
  return getStaffDisplayName(staffMember)
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function filterStaffMembers(
  staffMembers: StaffMember[],
  searchTerm: string,
): StaffMember[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return staffMembers;
  }

  return staffMembers.filter((staffMember) =>
    [
      staffMember.fullName,
      staffMember.name,
      staffMember.username,
      staffMember.email,
    ]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedSearchTerm)),
  );
}

export function parseSalary(value?: string): number {
  if (!value) {
    return 0;
  }

  const digits = String(value).replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(digits || "0");

  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildStaffSummary(staffMembers: StaffMember[]): StaffSummary {
  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter((staffMember) =>
    staffMember.isActive ?? staffMember.status !== "inactive",
  ).length;
  const performanceValues = staffMembers
    .map((staffMember) => staffMember.performance)
    .filter((value): value is number => typeof value === "number");
  const totalPayroll = staffMembers.reduce(
    (sum, staffMember) => sum + parseSalary(staffMember.salary),
    0,
  );
  const payrollRecords = staffMembers.filter(
    (staffMember) => parseSalary(staffMember.salary) > 0,
  ).length;

  return {
    totalStaff,
    activeStaff,
    inactiveStaff: Math.max(totalStaff - activeStaff, 0),
    avgPerformance: performanceValues.length
      ? Math.round(
          performanceValues.reduce((sum, value) => sum + value, 0) /
            performanceValues.length,
        )
      : 0,
    totalPayroll,
    payrollRecords,
    performanceRecordCount: performanceValues.length,
  };
}
