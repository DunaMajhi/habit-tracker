import {
  TRANSACTION_CATEGORIES,
  type Transaction,
  type TransactionCategory,
  type ValuationMetrics,
} from "@/types/valuation";

export const BASE_VALUATION = 10_000;
export const INVESTED_MULTIPLIER = 1.5;
export const WASTED_MULTIPLIER = 2;
export const DECAY_WINDOW_DAYS = 7;
export const DECAY_PENALTY_RATE = 0.05;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ValuationOptions {
  baseValuation?: number;
  investedMultiplier?: number;
  wastedMultiplier?: number;
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

export function calculateValuation(
  transactions: readonly Transaction[],
  options: ValuationOptions = {}
): ValuationMetrics {
  if (!Array.isArray(transactions)) {
    throw new ValuationCalculationError("transactions must be an array.");
  }

  const baseValuation = options.baseValuation ?? BASE_VALUATION;
  const investedMultiplier = options.investedMultiplier ?? INVESTED_MULTIPLIER;
  const wastedMultiplier = options.wastedMultiplier ?? WASTED_MULTIPLIER;
  const decayWindowDays = options.decayWindowDays ?? DECAY_WINDOW_DAYS;
  const decayPenaltyRate = options.decayPenaltyRate ?? DECAY_PENALTY_RATE;
  const now = options.now ?? new Date();

  assertFiniteNonNegative(baseValuation, "baseValuation");
  assertFiniteNonNegative(investedMultiplier, "investedMultiplier");
  assertFiniteNonNegative(wastedMultiplier, "wastedMultiplier");
  assertFiniteNonNegative(decayWindowDays, "decayWindowDays");
  assertFiniteNonNegative(decayPenaltyRate, "decayPenaltyRate");

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new ValuationCalculationError("now must be a valid Date instance.");
  }

  let totalInvested = 0;
  let totalWasted = 0;
  let totalOpEx = 0;
  let lastInvestedAtMs: number | null = null;

  transactions.forEach((transaction, index) => {
    validateTransaction(transaction, index);

    switch (transaction.category) {
      case "Invested": {
        totalInvested += transaction.amount;
        const transactionDate = parseTransactionDate(transaction.timestamp, index);
        const transactionMs = transactionDate.getTime();
        if (lastInvestedAtMs === null || transactionMs > lastInvestedAtMs) {
          lastInvestedAtMs = transactionMs;
        }
        break;
      }
      case "Wasted":
        totalWasted += transaction.amount;
        break;
      case "OpEx":
        totalOpEx += transaction.amount;
        break;
      default:
        break;
    }
  });

  const valuationBeforeDecay =
    baseValuation + totalInvested * investedMultiplier - totalWasted * wastedMultiplier;

  let shouldApplyDecay = true;
  if (lastInvestedAtMs !== null) {
    const daysSinceLastInvested =
      (now.getTime() - lastInvestedAtMs) / MS_PER_DAY;
    shouldApplyDecay = daysSinceLastInvested > decayWindowDays;
  }

  const decayPenaltyAmount = shouldApplyDecay
    ? valuationBeforeDecay * decayPenaltyRate
    : 0;

  const currentValuation = valuationBeforeDecay - decayPenaltyAmount;

  return {
    baseValuation: roundTo2(baseValuation),
    totalInvested: roundTo2(totalInvested),
    totalWasted: roundTo2(totalWasted),
    totalOpEx: roundTo2(totalOpEx),
    investedMultiplier: roundTo2(investedMultiplier),
    wastedMultiplier: roundTo2(wastedMultiplier),
    decayWindowDays: roundTo2(decayWindowDays),
    decayPenaltyRate: roundTo2(decayPenaltyRate),
    decayApplied: shouldApplyDecay,
    lastInvestedAt: lastInvestedAtMs ? new Date(lastInvestedAtMs).toISOString() : null,
    valuationBeforeDecay: roundTo2(valuationBeforeDecay),
    decayPenaltyAmount: roundTo2(decayPenaltyAmount),
    currentValuation: roundTo2(currentValuation),
  };
}
