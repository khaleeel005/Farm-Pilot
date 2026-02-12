// Cost Types Enum
export const CostTypes = {
  SUPERVISOR_SALARY: 'supervisor_salary',
  LABORER_SALARY: 'laborer_salary',
  ELECTRICITY: 'electricity',
  WATER: 'water',
  MAINTENANCE: 'maintenance',
  FEED: 'feed',
  MEDICATION: 'medication',
  TRANSPORTATION: 'transportation',
  EQUIPMENT: 'equipment',
  INSURANCE: 'insurance',
  RENT: 'rent',
  UTILITIES: 'utilities',
  SUPPLIES: 'supplies',
  REPAIRS: 'repairs',
  FUEL: 'fuel',
  SECURITY: 'security',
  CLEANING: 'cleaning',
  CONSULTING: 'consulting',
  TRAINING: 'training',
  OTHER: 'other',
} as const;

export type CostType = (typeof CostTypes)[keyof typeof CostTypes];

export interface CostTypeOption {
  key: string;
  value: CostType;
  label: string;
}

// New flexible cost entry interface
export interface CostEntry {
  id?: number;
  date: string;
  costType: CostType;
  description: string;
  amount: number;
  category?: 'operational' | 'capital' | 'emergency';
  paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'card' | 'mobile_money';
  vendor?: string;
  receiptNumber?: string;
  notes?: string;
  houseId?: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  house?: {
    id: number;
    name: string;
    location?: string;
  };
  creator?: {
    id: number;
    username: string;
  };
}

// Cost summary interfaces
export interface CostSummaryByType {
  costType: CostType;
  totalAmount: number;
  entryCount: number;
}

export interface CostSummaryByCategory {
  category: string;
  totalAmount: number;
  entryCount: number;
}

export interface CostSummary {
  costsByType: CostSummaryByType[];
  costsByCategory: CostSummaryByCategory[];
  totalSummary: {
    totalAmount: number;
    totalEntries: number;
    averageAmount: number;
  };
}

// Pagination interface
export interface CostEntriesResponse {
  costEntries: CostEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cost filters for API requests
export interface CostFilters {
  startDate?: string;
  endDate?: string;
  costType?: CostType;
  category?: string;
  houseId?: number;
  createdBy?: number;
  minAmount?: number;
  maxAmount?: number;
}

// Legacy operating cost interface (for backward compatibility)
export interface OperatingCost {
  id?: number;
  monthYear: string;
  supervisorSalary?: number;
  totalLaborerSalaries?: number;
  electricityCost?: number;
  waterCost?: number;
  maintenanceCost?: number;
  otherCosts?: number;
  totalMonthlyCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyCostData {
  date: string;
  totalFeedCost: number;
  totalLaborCost: number;
  totalOperatingCost: number;
  totalCost: number;
  eggProduction: number;
  costPerEgg: number;
}

export interface EggPriceEstimate {
  date: string;
  estimatedPrice: number;
  marketTrend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface DailyCalculation {
  date: string;
  production: {
    totalEggs: number;
    gradeA: number;
    gradeB: number;
    gradeC: number;
  };
  costs: {
    feed: number;
    labor: number;
    operating: number;
    total: number;
  };
  revenue: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    total: number;
  };
  profit: {
    gross: number;
    margin: number;
  };
}
