// Growth Investment Categories
export const GROWTH_CATEGORIES = ["Health", "Learning", "Infrastructure"] as const;

// Waste Categories
export const WASTE_CATEGORIES = ["Habits", "Impulse", "Entertainment"] as const;

// All transaction categories
export const TRANSACTION_CATEGORIES = [
  ...GROWTH_CATEGORIES,
  ...WASTE_CATEGORIES,
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
export type GrowthCategory = (typeof GROWTH_CATEGORIES)[number];
export type WasteCategory = (typeof WASTE_CATEGORIES)[number];

// Company Status
export const COMPANY_STATUS = ["Thriving", "AtRisk", "Critical", "Bankrupt"] as const;
export type CompanyStatus = (typeof COMPANY_STATUS)[number];

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  timestamp: string;
}

export interface ValuationMetrics {
  baseValuation: number;
  totalGrowth: number;
  totalWaste: number;
  totalOpEx: number;
  growthMultiplier: number;
  wasteMultiplier: number;
  decayWindowDays: number;
  decayPenaltyRate: number;
  decayAccelerated: boolean;
  decayApplied: boolean;
  lastInvestedAt: string | null;
  valuationBeforeDecay: number;
  decayPenaltyAmount: number;
  currentValuation: number;
  valuationChangePercent: number;
  companyStatus: CompanyStatus;
  isNearBankruptcy: boolean;
  daysToBankruptcy: number | null;
  companyHealthPercent: number;
}
