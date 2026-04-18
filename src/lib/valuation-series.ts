import { calculateValuation } from "@/utils/valuation-company";
import { GROWTH_CATEGORIES, WASTE_CATEGORIES } from "@/types/valuation";
import type { Transaction } from "@/types/valuation";

export interface ValuationSeriesPoint {
  isoDate: string;
  label: string;
  valuation: number;
  open: number;
  high: number;
  low: number;
  close: number;
  upTrend: number | null;
  downTrend: number | null;
  volume: number;
  investedAmount: number;
  wastedAmount: number;
  soldAmount: number;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fromUtcDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildTrendLines(points: ValuationSeriesPoint[]): ValuationSeriesPoint[] {
  if (points.length <= 1) {
    return points;
  }

  const result: ValuationSeriesPoint[] = points.map((point) => ({
    ...point,
    upTrend: null as number | null,
    downTrend: null as number | null,
  }));

  for (let i = 1; i < result.length; i += 1) {
    const prev = result[i - 1];
    const current = result[i];

    if (current.valuation >= prev.valuation) {
      if (result[i - 1].upTrend === null) {
        result[i - 1].upTrend = prev.valuation;
      }
      result[i].upTrend = current.valuation;
      continue;
    }

    if (result[i - 1].downTrend === null) {
      result[i - 1].downTrend = prev.valuation;
    }
    result[i].downTrend = current.valuation;
  }

  return result;
}

export function buildValuationSeries(
  transactions: readonly Transaction[]
): ValuationSeriesPoint[] {
  if (transactions.length === 0) {
    return [];
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstDate = fromUtcDateKey(toUtcDateKey(new Date(sorted[0].timestamp)));
  const lastDate = fromUtcDateKey(
    toUtcDateKey(new Date(sorted[sorted.length - 1].timestamp))
  );

  const includedTransactions: Transaction[] = [];
  const series: ValuationSeriesPoint[] = [];
  let transactionCursor = 0;
  let previousValuation = 0;

  for (
    let currentDate = firstDate;
    currentDate.getTime() <= lastDate.getTime();
    currentDate = addUtcDays(currentDate, 1)
  ) {
    const dayEnd = endOfUtcDay(currentDate).getTime();

    // Track daily transactions for volume calculation
    const dailyTransactions: Transaction[] = [];
    let dailyInvested = 0;
    let dailyWasted = 0;

    while (transactionCursor < sorted.length) {
      const timestamp = new Date(sorted[transactionCursor].timestamp).getTime();
      if (timestamp > dayEnd) {
        break;
      }

      includedTransactions.push(sorted[transactionCursor]);
      dailyTransactions.push(sorted[transactionCursor]);

      // Calculate daily amounts by category
      if (
        (GROWTH_CATEGORIES as readonly string[]).includes(
          sorted[transactionCursor].category
        )
      ) {
        dailyInvested += sorted[transactionCursor].amount;
      } else if (
        (WASTE_CATEGORIES as readonly string[]).includes(
          sorted[transactionCursor].category
        )
      ) {
        dailyWasted += sorted[transactionCursor].amount;
      }

      transactionCursor += 1;
    }

    const metrics = calculateValuation(includedTransactions, {
      now: endOfUtcDay(currentDate),
    });

    const currentValuation = metrics.currentValuation;
    const isoDate = toUtcDateKey(currentDate);

    series.push({
      isoDate,
      label: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
      }).format(currentDate),
      valuation: currentValuation,
      open: previousValuation || currentValuation,
      high: Math.max(previousValuation || currentValuation, currentValuation),
      low: Math.min(previousValuation || currentValuation, currentValuation),
      close: currentValuation,
      upTrend: null,
      downTrend: null,
      volume: dailyTransactions.length,
      investedAmount: dailyInvested,
      wastedAmount: dailyWasted,
      soldAmount: 0,
    });

    previousValuation = currentValuation;
  }

  return buildTrendLines(series);
}
