import {
  GROWTH_CATEGORIES,
  WASTE_CATEGORIES,
  TRANSACTION_CATEGORIES,
  type Transaction,
  type TransactionCategory,
  type ValuationMetrics,
  type CompanyStatus,
} from "@/types/valuation";

// Company Thresholds
export const BASE_VALUATION = 10_000;
export const GROWTH_MULTIPLIER = 1.2;
export const WASTE_MULTIPLIER = 2.5;
export const DECAY_WINDOW_DAYS = 7;
export const DECAY_PENALTY_RATE = 0.05;
export const ACCELERATED_DECAY_RATE = 0.1;
export const BANKRUPTCY_THRESHOLD = -0.5;
export const CRITICAL_THRESHOLD = -0.2;
export const AT_RISK_THRESHOLD = -0.05;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ValuationOptions {
  baseValuation?: number;
  growthMultiplier?: number;
  wasteMultiplier?: number;
  decayWindowDays?: number;
  decayPenaltyRate?: number;
  now?: Date;
}

export class ValuationCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValuationCalculationError";
  }
}

const categorySet = new Set<TransactionCategory>(TRANSACTION_CATEGORIES);
const growthSet = new Set(GROWTH_CATEGORIES);
const wasteSet = new Set(WASTE_CATEGORIES);

function assertFiniteNonNegative(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new ValuationCalculationError(`${fieldName} must be a finite number.`);
  }
  if (value < 0) {
    throw new ValuationCalculationError(`${fieldName} must be non-negative.`);
  }
}

function parseTransactionDate(timestamp: string, index: number): Date {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new ValuationCalculationError(
      `Transaction at index ${index} has an invalid timestamp.`
    );
  }
  return date;
}

function validateTransaction(transaction: Transaction, index: number): void {
  if (!transaction || typeof transaction !== "object") {
    throw new ValuationCalculationError(
      `Transaction at index ${index} must be an object.`
    );
  }
  if (typeof transaction.id !== "string" || transaction.id.trim().length === 0) {
    throw new ValuationCalculationError(
      `Transaction at index ${index} must include a non-empty id.`
    );
  }
  if (
    typeof transaction.description !== "string" ||
    transaction.description.trim().length === 0
  ) {
    throw new ValuationCalculationError(
      `Transaction at index ${index} must include a non-empty description.`
    );
  }
  if (!categorySet.has(transaction.category)) {
    throw new ValuationCalculationError(
      `Transaction at index ${index} contains an unsupported category.`
    );
  }
  assertFiniteNonNegative(transaction.amount, `transaction.amount at index ${index}`);
  parseTransactionDate(transaction.timestamp, index);
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function getCompanyStatus(changePercent: number): CompanyStatus {
  if (changePercent <= BANKRUPTCY_THRESHOLD) return "Bankrupt";
  if (changePercent <= CRITICAL_THRESHOLD) return "Critical";
  if (changePercent <= AT_RISK_THRESHOLD) return "AtRisk";
  return "Thriving";
}

function calculateDaysToBankruptcy(
  currentValuation: number,
  baseValuation: number,
  now: Date,
  lastInvestedAt: Date | null
): number | null {
  if (currentValuation > 0) return null;
  if (lastInvestedAt) {
    const daysSinceInvestment = (now.getTime() - lastInvestedAt.getTime()) / MS_PER_DAY;
    if (daysSinceInvestment > DECAY_WINDOW_DAYS) {
      return Math.ceil(daysSinceInvestment - DECAY_WINDOW_DAYS);
    }
  }
  return 0;
}

export function calculateValuation(
  transactions: readonly Transaction[],
  options: ValuationOptions = {}
): ValuationMetrics {
  if (!Array.isArray(transactions)) {
    throw new ValuationCalculationError("transactions must be an array.");
  }

  const baseValuation = options.baseValuation ?? BASE_VALUATION;
  const growthMultiplier = options.growthMultiplier ?? GROWTH_MULTIPLIER;
  const wasteMultiplier = options.wasteMultiplier ?? WASTE_MULTIPLIER;
  const decayWindowDays = options.decayWindowDays ?? DECAY_WINDOW_DAYS;
  const decayPenaltyRate = options.decayPenaltyRate ?? DECAY_PENALTY_RATE;
  const now = options.now ?? new Date();

  assertFiniteNonNegative(baseValuation, "baseValuation");
  assertFiniteNonNegative(growthMultiplier, "growthMultiplier");
  assertFiniteNonNegative(wasteMultiplier, "wasteMultiplier");
  assertFiniteNonNegative(decayWindowDays, "decayWindowDays");
  assertFiniteNonNegative(decayPenaltyRate, "decayPenaltyRate");

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new ValuationCalculationError("now must be a valid Date instance.");
  }

  let totalGrowth = 0;
  let totalWaste = 0;
  let totalOpEx = 0;
  let lastInvestedAtMs: number | null = null;

  transactions.forEach((transaction, index) => {
    validateTransaction(transaction, index);

    if (growthSet.has(transaction.category)) {
      totalGrowth += transaction.amount;
      const transactionDate = parseTransactionDate(transaction.timestamp, index);
      const transactionMs = transactionDate.getTime();
      if (lastInvestedAtMs === null || transactionMs > lastInvestedAtMs) {
        lastInvestedAtMs = transactionMs;
      }
    } else if (wasteSet.has(transaction.category)) {
      totalWaste += transaction.amount;
    } else if (transaction.category === "OpEx") {
      totalOpEx += transaction.amount;
    }
  });

  const valuationBeforeDecay =
    baseValuation + totalGrowth * growthMultiplier - totalWaste * wasteMultiplier;

  let shouldApplyDecay = true;
  let decayRate = decayPenaltyRate;

  if (lastInvestedAtMs !== null) {
    const daysSinceLastInvested = (now.getTime() - lastInvestedAtMs) / MS_PER_DAY;
    shouldApplyDecay = daysSinceLastInvested > decayWindowDays;

    if (shouldApplyDecay && valuationBeforeDecay < baseValuation * (1 + AT_RISK_THRESHOLD)) {
      decayRate = ACCELERATED_DECAY_RATE;
    }
  } else {
    shouldApplyDecay = true;
    if (valuationBeforeDecay < baseValuation * (1 + AT_RISK_THRESHOLD)) {
      decayRate = ACCELERATED_DECAY_RATE;
    }
  }

  const decayPenaltyAmount = shouldApplyDecay ? valuationBeforeDecay * decayRate : 0;
  const currentValuation = Math.max(valuationBeforeDecay - decayPenaltyAmount, 0);

  const changePercent = baseValuation > 0 ? (currentValuation - baseValuation) / baseValuation : 0;
  const companyStatus = getCompanyStatus(changePercent);
  const isNearBankruptcy = changePercent <= CRITICAL_THRESHOLD;
  const lastInvestedAt = lastInvestedAtMs ? new Date(lastInvestedAtMs) : null;
  const daysToBankruptcy = calculateDaysToBankruptcy(
    currentValuation,
    baseValuation,
    now,
    lastInvestedAt
  );
  const companyHealthPercent = Math.max(0, Math.round((currentValuation / baseValuation) * 100));

  return {
    baseValuation: roundTo2(baseValuation),
    totalGrowth: roundTo2(totalGrowth),
    totalWaste: roundTo2(totalWaste),
    totalOpEx: roundTo2(totalOpEx),
    growthMultiplier: roundTo2(growthMultiplier),
    wasteMultiplier: roundTo2(wasteMultiplier),
    decayWindowDays: roundTo2(decayWindowDays),
    decayPenaltyRate: roundTo2(decayPenaltyRate),
    decayAccelerated: shouldApplyDecay && decayRate > decayPenaltyRate,
    decayApplied: shouldApplyDecay,
    lastInvestedAt: lastInvestedAt?.toISOString() ?? null,
    valuationBeforeDecay: roundTo2(valuationBeforeDecay),
    decayPenaltyAmount: roundTo2(decayPenaltyAmount),
    currentValuation: roundTo2(currentValuation),
    valuationChangePercent: roundTo2(changePercent * 100),
    companyStatus,
    isNearBankruptcy,
    daysToBankruptcy,
    companyHealthPercent,
  };
}
