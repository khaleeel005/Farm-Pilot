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

export interface CostSummary {
  startDate: string;
  endDate: string;
  totalFeedCost: number;
  totalLaborCost: number;
  totalOperatingCost: number;
  totalCost: number;
  totalEggProduction: number;
  averageCostPerEgg: number;
  dailyBreakdown: DailyCostData[];
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
