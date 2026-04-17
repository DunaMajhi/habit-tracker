export const TRANSACTION_CATEGORIES = ["Invested", "Wasted", "OpEx"] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  timestamp: string;
}

export interface ValuationMetrics {
  baseValuation: number;
  totalInvested: number;
  totalWasted: number;
  totalOpEx: number;
  investedMultiplier: number;
  wastedMultiplier: number;
  decayWindowDays: number;
  decayPenaltyRate: number;
  decayApplied: boolean;
  lastInvestedAt: string | null;
  valuationBeforeDecay: number;
  decayPenaltyAmount: number;
  currentValuation: number;
}
