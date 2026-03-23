import type { Laborer, User } from "@/types";

export interface FarmWorker {
  attendanceStatus: "present";
  id: string;
  name: string;
  role: "Laborer" | "Staff";
  tasks: string[];
}

function toStaffWorker(staffMember: User): FarmWorker {
  return {
    id: String(staffMember.id),
    name: staffMember.username || "Unknown",
    role: "Staff",
    attendanceStatus: "present",
    tasks: [],
  };
}

function toLaborerWorker(laborer: Laborer): FarmWorker {
  return {
    id: String(laborer.id),
    name: laborer.fullName,
    role: "Laborer",
    attendanceStatus: "present",
    tasks: [],
  };
}

export function buildFarmWorkers(
  staffMembers: User[],
  laborers: Laborer[],
): FarmWorker[] {
  return [
    ...staffMembers.map(toStaffWorker),
    ...laborers.map(toLaborerWorker),
  ];
}
