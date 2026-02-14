export type DateString = string;
export type Numeric = number | string;

export interface UserEntity {
  id: number;
  username: string;
  password: string;
  role: "owner" | "staff";
  isActive: boolean;
  email?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HouseEntity {
  id: number;
  houseName: string;
  capacity: number;
  currentBirdCount: number;
  location?: string | null;
  description?: string | null;
  status: "active" | "maintenance" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyLogEntity {
  id: number;
  logDate: DateString;
  houseId: number;
  eggsCollected: number;
  crackedEggs: number;
  feedBatchId?: number | null;
  feedBagsUsed?: Numeric | null;
  mortalityCount: number;
  notes?: string | null;
  supervisorId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeedBatchEntity {
  id: number;
  batchDate: DateString;
  batchName: string;
  totalQuantityTons: Numeric;
  bagSizeKg: Numeric;
  totalBags: number;
  totalCost: Numeric;
  costPerBag: Numeric;
  costPerKg: Numeric;
  miscellaneousCost: Numeric;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BatchIngredientEntity {
  id: number;
  batchId: number;
  ingredientName: string;
  quantityKg: Numeric;
  totalCost: Numeric;
  costPerKg: Numeric;
  supplier?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeedRecipeEntity {
  id: number;
  recipeName: string;
  cornPercent: Numeric;
  soybeanPercent: Numeric;
  wheatBranPercent: Numeric;
  limestonePercent: Numeric;
  otherIngredients?: Record<string, Numeric> | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerEntity {
  id: number;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SalesEntity {
  id: number;
  saleDate: DateString;
  customerId: number;
  quantity: number;
  pricePerEgg: Numeric;
  totalAmount: Numeric;
  paymentMethod: "cash" | "transfer" | "check";
  paymentStatus: "paid" | "pending";
  supervisorId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LaborerEntity {
  id: number;
  employeeId?: string | null;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  monthlySalary: Numeric;
  hireDate?: DateString | null;
  isActive: boolean;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkAssignmentEntity {
  id: number;
  laborerId: number;
  date: DateString;
  tasksAssigned?: string[] | null;
  attendanceStatus: "present" | "absent" | "half_day" | "late";
  performanceNotes?: string | null;
  hours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayrollEntity {
  id: number;
  monthYear: string;
  laborerId: number;
  baseSalary: Numeric;
  daysWorked: Numeric;
  daysAbsent: Numeric;
  salaryDeductions: Numeric;
  bonusAmount: Numeric;
  finalSalary: Numeric;
  paymentDate?: DateString | null;
  paymentStatus: "pending" | "paid";
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OperatingCostEntity {
  id: number;
  monthYear: DateString;
  supervisorSalary: Numeric;
  totalLaborerSalaries: Numeric;
  electricityCost: Numeric;
  waterCost: Numeric;
  maintenanceCost: Numeric;
  otherCosts: Numeric;
  totalMonthlyCost: Numeric;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CostType =
  | "supervisor_salary"
  | "laborer_salary"
  | "electricity"
  | "water"
  | "maintenance"
  | "feed"
  | "medication"
  | "transportation"
  | "equipment"
  | "utilities"
  | "supplies"
  | "repairs"
  | "fuel"
  | "security"
  | "cleaning"
  | "consulting"
  | "other";

export interface CostEntryEntity {
  id: number;
  date: DateString;
  costType: CostType;
  description: string;
  amount: Numeric;
  category: "operational" | "capital" | "emergency";
  paymentMethod?: "cash" | "bank_transfer" | "check" | "card" | "mobile_money" | null;
  vendor?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  houseId?: number | null;
  createdBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BirdCostEntity {
  id: number;
  batchDate: DateString;
  birdsPurchased: number;
  costPerBird: Numeric;
  vaccinationCostPerBird: Numeric;
  expectedLayingMonths: number;
  createdAt?: Date;
  updatedAt?: Date;
}

