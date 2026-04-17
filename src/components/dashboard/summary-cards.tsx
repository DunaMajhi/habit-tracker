import { AlertTriangle, ArrowDownRight, ArrowUpRight, Landmark } from "lucide-react";
import type { ValuationMetrics } from "@/types/valuation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardsProps {
  metrics: ValuationMetrics;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-slate-900/20 bg-slate-950 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            Current Valuation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(metrics.currentValuation)}
          </div>
          <Landmark className="h-5 w-5 text-emerald-400" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Invested</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(metrics.totalInvested)}
          </div>
          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Wasted</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between">
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics.totalWasted)}
          </div>
          <ArrowDownRight className="h-5 w-5 text-red-600" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Decay Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          {metrics.decayApplied ? (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Penalty Active
            </Badge>
          ) : (
            <Badge variant="success">No Active Penalty</Badge>
          )}
          <div className="text-xs text-slate-500">7-day invested window</div>
        </CardContent>
      </Card>
    </section>
  );
}
