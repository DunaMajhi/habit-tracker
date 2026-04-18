"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { ValuationSeriesPoint } from "@/lib/valuation-series";

interface ValuationChartProps {
  data: ValuationSeriesPoint[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateStats(data: ValuationSeriesPoint[]) {
  if (data.length === 0) {
    return { current: 0, high: 0, low: 0, change: 0, changePercent: 0, avg: 0 };
  }

  const valuations = data.map((d) => d.valuation);
  const current = valuations[valuations.length - 1];
  const previous = valuations[0];
  const high = Math.max(...valuations);
  const low = Math.min(...valuations);
  const avg = valuations.reduce((a, b) => a + b, 0) / valuations.length;
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  return { current, high, low, change, changePercent, avg };
}

function CustomTooltip(
  props: Readonly<{
    active?: boolean;
    payload?: Array<{ payload: ValuationSeriesPoint }>;
    label?: string;
  }>
) {
  const { active, payload, label } = props;
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as ValuationSeriesPoint;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-slate-600">
          Current: <span className="font-semibold text-slate-900">{formatCurrencyDetailed(data.valuation)}</span>
        </p>
        {data.upTrend !== null && (
          <p className="text-green-600">
            Up Trend: <span className="font-semibold">{formatCurrency(data.upTrend)}</span>
          </p>
        )}
        {data.downTrend !== null && (
          <p className="text-red-600">
            Down Trend: <span className="font-semibold">{formatCurrency(data.downTrend)}</span>
          </p>
        )}
      </div>
    </div>
  );
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

  const stats = calculateStats(data);
  const isPositive = stats.change >= 0;

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <div className="space-y-4">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">Valuation Trajectory</CardTitle>
            <p className="mt-1 text-sm text-slate-600">Tracking your net worth evolution</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(stats.current)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 border border-green-200">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">High</p>
              <p className="mt-2 text-xl font-bold text-green-600">{formatCurrency(stats.high)}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 border border-red-200">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">Low</p>
              <p className="mt-2 text-xl font-bold text-red-600">{formatCurrency(stats.low)}</p>
            </div>
            <div className={`rounded-lg p-3 border ${isPositive ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200"}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Change</p>
              <div className="mt-2 flex items-center gap-2">
                {isPositive ? (
                  <ArrowUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-orange-600" />
                )}
                <span className={`text-xl font-bold ${isPositive ? "text-emerald-600" : "text-orange-600"}`}>
                  {isPositive ? "+" : ""}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div style={{ width: "100%", height: "400px" }} className="bg-slate-50 rounded-lg border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ left: 0, right: 16, top: 16, bottom: 16 }}
            >
              <defs>
                <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="8 4"
                vertical={true}
                horizontalPoints={[]}
              />

              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
                tickLine={false}
              />

              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
                tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
                tickLine={false}
                width={60}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.05)" }} />

              <ReferenceLine
                y={stats.avg}
                stroke="#cbd5e1"
                strokeDasharray="8 4"
                strokeWidth={1}
                label={{
                  value: `Avg: ${formatCurrency(stats.avg)}`,
                  position: "right",
                  fill: "#64748b",
                  fontSize: 11,
                  offset: 5,
                }}
              />

              {/* Main valuation area */}
              <Area
                type="monotone"
                dataKey="valuation"
                fill="url(#colorValuation)"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />

              {/* Uptrend line */}
              <Line
                type="monotone"
                dataKey="upTrend"
                name="Upward Trend"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />

              {/* Downtrend line */}
              <Line
                type="monotone"
                dataKey="downTrend"
                name="Downward Trend"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />

              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
