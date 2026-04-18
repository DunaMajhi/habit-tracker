import type { ValuationSeriesPoint } from "@/lib/valuation-series";
import type { CompanyStatus } from "@/types/valuation";

export interface ValuationForecastPoint {
  dayOffset: number;
  predictedValuation: number;
}

export interface MLInsights {
  slopePerDay: number;
  predicted7DayValuation: number;
  predicted14DayValuation: number;
  predicted30DayValuation: number;
  predictedStatus: CompanyStatus;
  bankruptcyRiskPercent: number;
  recommendedAction: string;
  confidence: number;
  forecast: ValuationForecastPoint[];
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getStatusFromChangePercent(changePercent: number): CompanyStatus {
  if (changePercent <= -50) return "Bankrupt";
  if (changePercent <= -20) return "Critical";
  if (changePercent <= -5) return "AtRisk";
  return "Thriving";
}

function fitLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i - xMean;
    const y = values[i] - yMean;
    numerator += x * y;
    denominator += x * x;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function predictValue(slope: number, intercept: number, dayIndex: number): number {
  return Math.max(0, slope * dayIndex + intercept);
}

export function generateMLInsights(series: ValuationSeriesPoint[]): MLInsights {
  if (series.length === 0) {
    return {
      slopePerDay: 0,
      predicted7DayValuation: 0,
      predicted14DayValuation: 0,
      predicted30DayValuation: 0,
      predictedStatus: "Thriving",
      bankruptcyRiskPercent: 0,
      recommendedAction: "Add your first transactions to train the model.",
      confidence: 0,
      forecast: [],
    };
  }

  const values = series.map((point) => point.valuation);
  const { slope, intercept } = fitLinearRegression(values);
  const currentValuation = values[values.length - 1];
  const baseValuation = values[0] || currentValuation || 1;
  const changePercent = ((currentValuation - baseValuation) / baseValuation) * 100;

  const predicted7DayValuation = predictValue(slope, intercept, values.length - 1 + 7);
  const predicted14DayValuation = predictValue(slope, intercept, values.length - 1 + 14);
  const predicted30DayValuation = predictValue(slope, intercept, values.length - 1 + 30);

  const forecast: ValuationForecastPoint[] = [7, 14, 30].map((dayOffset) => ({
    dayOffset,
    predictedValuation: roundTo2(predictValue(slope, intercept, values.length - 1 + dayOffset)),
  }));

  const predictedStatus = getStatusFromChangePercent(
    ((predicted7DayValuation - baseValuation) / baseValuation) * 100
  );

  const downwardSlope = slope < 0;
  const bankruptcyRiskPercent = clamp(
    downwardSlope
      ? Math.abs(slope) / Math.max(currentValuation, 1) * 1000
      : 0,
    0,
    100
  );

  let recommendedAction = "Keep the current strategy. The model is stable.";
  if (downwardSlope && bankruptcyRiskPercent > 35) {
    recommendedAction = "Prioritize Health or Learning spending. The model sees a sharp decline.";
  } else if (downwardSlope) {
    recommendedAction = "Reduce wasteful categories and increase one growth investment this week.";
  } else if (changePercent < 5) {
    recommendedAction = "Add a stronger growth habit to accelerate compounding.";
  } else {
    recommendedAction = "Growth is healthy. Maintain the mix and avoid impulse spending.";
  }

  const confidence = clamp(Math.abs(slope) / Math.max(currentValuation, 1) * 500 + 55, 40, 92);

  return {
    slopePerDay: roundTo2(slope),
    predicted7DayValuation: roundTo2(predicted7DayValuation),
    predicted14DayValuation: roundTo2(predicted14DayValuation),
    predicted30DayValuation: roundTo2(predicted30DayValuation),
    predictedStatus,
    bankruptcyRiskPercent: roundTo2(bankruptcyRiskPercent),
    recommendedAction,
    confidence: roundTo2(confidence),
    forecast,
  };
}