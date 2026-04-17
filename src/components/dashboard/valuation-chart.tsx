"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ValuationSeriesPoint } from "@/lib/valuation-series";

interface ValuationChartProps {
  data: ValuationSeriesPoint[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ValuationChart({ data }: ValuationChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valuation Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            No transactions found yet. Add your first entry to render the valuation trend.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valuation Trajectory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[280px] w-full sm:min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 16, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                tickFormatter={(value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`}
                tickLine={false}
                axisLine={false}
                width={92}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number"
                    ? formatCurrency(value)
                    : String(value ?? "")
                }
                labelFormatter={(label) => `Date: ${String(label)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="upTrend"
                name="Upward Trend"
                stroke="#16a34a"
                strokeWidth={3}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="downTrend"
                name="Downward Trend"
                stroke="#dc2626"
                strokeWidth={3}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
