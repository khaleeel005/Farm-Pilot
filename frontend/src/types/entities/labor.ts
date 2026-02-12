/**
 * Laborer - Matches backend Laborer model exactly
 */
export interface Laborer {
  id: number;
  employeeId: string | null;
  fullName: string;
  phone: string | null;
  address: string | null;
  monthlySalary: number;
  hireDate: string | null;
  isActive: boolean;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * WorkAssignment - Matches backend WorkAssignment model exactly
 */
export interface WorkAssignment {
  id: number;
  laborerId: number;
  date: string;
  tasksAssigned: string[] | null;
  attendanceStatus: 'present' | 'absent' | 'half_day' | 'late';
  performanceNotes: string | null;
  hours: number;
  createdAt?: string;
  updatedAt?: string;
  // Included associations
  laborer?: Laborer;
}

/**
 * Payroll - Matches backend Payroll model exactly
 */
export interface Payroll {
  id: number;
  monthYear: string;
  laborerId: number;
  baseSalary: number;
  daysWorked: number;
  daysAbsent: number;
  salaryDeductions: number;
  bonusAmount: number;
  finalSalary: number;
  paymentDate: string | null;
  paymentStatus: 'pending' | 'paid';
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Included associations
  laborer?: Laborer;
}

/**
 * Payload for creating/updating laborers
 */
export interface LaborerPayload {
  employeeId?: string;
  fullName: string;
  phone?: string;
  address?: string;
  monthlySalary: number;
  hireDate?: string;
  isActive?: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
}

/**
 * Payload for creating/updating work assignments
 */
export interface WorkAssignmentPayload {
  laborerId: number;
  date: string;
  tasksAssigned?: string[];
  attendanceStatus?: 'present' | 'absent' | 'half_day' | 'late';
  performanceNotes?: string;
  hours?: number;
}

/**
 * Payload for updating payroll
 */
export interface PayrollPayload {
  salaryDeductions?: number;
  bonusAmount?: number;
  paymentDate?: string;
  paymentStatus?: 'pending' | 'paid';
  notes?: string;
}
