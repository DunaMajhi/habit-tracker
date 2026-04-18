import { BrainCircuit, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MLInsights } from "@/lib/ml-insights";

interface MLInsightsCardProps {
  insights: MLInsights;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function MLInsightsCard({ insights }: MLInsightsCardProps) {
  const isRisky = insights.bankruptcyRiskPercent >= 35;

  return (
    <Card className={`border-2 ${isRisky ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              ML Forecast
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Linear regression trained on your valuation history.
            </p>
          </div>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {insights.confidence.toFixed(0)}% confidence
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">7 Day Forecast</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(insights.predicted7DayValuation)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">14 Day Forecast</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(insights.predicted14DayValuation)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">30 Day Forecast</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatCurrency(insights.predicted30DayValuation)}
            </p>
          </div>
        </div>

        <div className={`rounded-lg border p-3 ${isRisky ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-2">
            <TrendingDown className={`h-4 w-4 ${isRisky ? "text-red-600" : "text-emerald-600"}`} />
            <p className={`text-sm font-semibold ${isRisky ? "text-red-900" : "text-emerald-900"}`}>
              Bankruptcy Risk: {insights.bankruptcyRiskPercent.toFixed(1)}%
            </p>
          </div>
          <p className={`mt-2 text-sm ${isRisky ? "text-red-800" : "text-emerald-800"}`}>
            Predicted status: {insights.predictedStatus}
          </p>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <Sparkles className="h-4 w-4" />
            Model Recommendation
          </p>
          <p className="mt-2 text-sm text-indigo-800">{insights.recommendedAction}</p>
        </div>
      </CardContent>
    </Card>
  );
}