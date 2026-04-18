"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import type { ValuationSeriesPoint } from "@/lib/valuation-series";

interface ValuationChartEnhancedProps {
  data: ValuationSeriesPoint[];
}

type ChartType = "area" | "line" | "bar" | "combined" | "volume";
type TimeRange = "all" | "3m" | "6m" | "1y";

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
    return {
      current: 0,
      high: 0,
      low: 0,
      change: 0,
      changePercent: 0,
      avg: 0,
      ma7: 0,
      ma14: 0,
    };
  }

  const valuations = data.map((d) => d.valuation);
  const current = valuations[valuations.length - 1];
  const previous = valuations[0];
  const high = Math.max(...valuations);
  const low = Math.min(...valuations);
  const avg = valuations.reduce((a, b) => a + b, 0) / valuations.length;

  // Calculate moving averages
  const ma7 = valuations.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, valuations.length);
  const ma14 = valuations.slice(-14).reduce((a, b) => a + b, 0) / Math.min(14, valuations.length);

  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  return { current, high, low, change, changePercent, avg, ma7, ma14 };
}

function filterDataByRange(data: ValuationSeriesPoint[], range: TimeRange) {
  const now = new Date();
  const cutoffDate = new Date();

  switch (range) {
    case "3m":
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return data;
  }

  return data.filter((d) => new Date(d.isoDate).getTime() >= cutoffDate.getTime());
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-slate-600">
          Close: <span className="font-semibold text-slate-900">{formatCurrencyDetailed(data.close)}</span>
        </p>
        <p className="text-slate-600">
          Open: <span className="font-semibold text-slate-900">{formatCurrencyDetailed(data.open)}</span>
        </p>
        <p className="text-green-600">
          High: <span className="font-semibold">{formatCurrency(data.high)}</span>
        </p>
        <p className="text-red-600">
          Low: <span className="font-semibold">{formatCurrency(data.low)}</span>
        </p>
        {data.volume > 0 && (
          <p className="text-slate-600">
            Volume: <span className="font-semibold">{data.volume} transactions</span>
          </p>
        )}
        {data.investedAmount > 0 && (
          <p className="text-blue-600">
            Invested: <span className="font-semibold">{formatCurrency(data.investedAmount)}</span>
          </p>
        )}
        {data.wastedAmount > 0 && (
          <p className="text-orange-600">
            Wasted: <span className="font-semibold">{formatCurrency(data.wastedAmount)}</span>
          </p>
        )}
        {data.soldAmount > 0 && (
          <p className="text-purple-600">
            Sold: <span className="font-semibold">{formatCurrency(data.soldAmount)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function AreaChartView({
  data,
  stats,
}: {
  data: ValuationSeriesPoint[];
  stats: ReturnType<typeof calculateStats>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 16 }}>
        <defs>
          <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="8 4" />
        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.05)" }} />
        <ReferenceLine y={stats.ma7} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label="MA7" />
        <ReferenceLine y={stats.ma14} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} label="MA14" />
        <Area type="monotone" dataKey="close" fill="url(#colorValuation)" stroke="#3b82f6" strokeWidth={3} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LineChartView({
  data,
  stats,
}: {
  data: ValuationSeriesPoint[];
  stats: ReturnType<typeof calculateStats>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 16 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="8 4" />
        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={stats.ma7} stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} name="MA7" />
        <ReferenceLine y={stats.ma14} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} name="MA14" />
        <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={3} dot={false} name="Close" isAnimationActive={false} />
        <Line type="monotone" dataKey="upTrend" stroke="#16a34a" strokeWidth={2} dot={false} name="Uptrend" connectNulls isAnimationActive={false} />
        <Line type="monotone" dataKey="downTrend" stroke="#dc2626" strokeWidth={2} dot={false} name="Downtrend" connectNulls isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartView({ data }: { data: ValuationSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 16 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="8 4" />
        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="close" fill="#3b82f6" name="Close" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="ma7" stroke="#10b981" strokeWidth={2} name="MA7" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function CombinedChartView({ data }: { data: ValuationSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 16 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="8 4" />
        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} />
        <YAxis
          yAxisId="left"
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tickFormatter={(value: number) => `₹${Math.round(value / 1000)}k`}
          tickLine={false}
          width={60}
        />
        <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area yAxisId="left" type="monotone" dataKey="close" fill="url(#colorGradient)" stroke="#3b82f6" strokeWidth={3} dot={false} name="Valuation" />
        <Bar yAxisId="right" dataKey="volume" fill="#fbbf24" name="Transaction Volume" radius={[4, 4, 0, 0]} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function VolumeChartView({ data }: { data: ValuationSeriesPoint[] }) {
  const volumeData = data.map((d) => ({
    ...d,
    positiveVolume: d.investedAmount,
    negativeVolume: -d.wastedAmount,
    soldVolume: -d.soldAmount,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={volumeData} margin={{ left: 0, right: 16, top: 16, bottom: 16 }}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="8 4" />
        <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: "12px" }} tickLine={false} />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: "12px" }}
          tickFormatter={(value: number) => `₹${Math.abs(value / 1000)}k`}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="positiveVolume" stackId="volume" fill="#10b981" name="Invested" radius={[4, 4, 0, 0]} />
        <Bar dataKey="negativeVolume" stackId="volume" fill="#ef4444" name="Wasted" radius={[4, 4, 0, 0]} />
        <Bar dataKey="soldVolume" stackId="volume" fill="#a855f7" name="Sold" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} yAxisId="right" name="Valuation" dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function ValuationChartEnhanced({ data }: ValuationChartEnhancedProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

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

  const filteredData = filterDataByRange(data, timeRange);
  const stats = calculateStats(filteredData);
  const isPositive = stats.change >= 0;

  return (
    <Card className="bg-white">
      <CardHeader className="border-b border-slate-200 pb-4">
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">Valuation Trajectory</CardTitle>
              <p className="mt-1 text-sm text-slate-600">Professional stock market analytics</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current</p>
              <p className="mt-1 text-base font-bold text-slate-900">{formatCurrency(stats.current)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2 border border-green-200">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">High</p>
              <p className="mt-1 text-base font-bold text-green-600">{formatCurrency(stats.high)}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2 border border-red-200">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">Low</p>
              <p className="mt-1 text-base font-bold text-red-600">{formatCurrency(stats.low)}</p>
            </div>
            <div className={`rounded-lg p-2 border ${isPositive ? "bg-emerald-50 border-emerald-200" : "bg-orange-50 border-orange-200"}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Change</p>
              <div className="mt-1 flex items-center gap-1">
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-orange-600" />
                )}
                <span className={`text-base font-bold ${isPositive ? "text-emerald-600" : "text-orange-600"}`}>
                  {isPositive ? "+" : ""}{stats.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 border border-blue-200 hidden md:block">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Avg</p>
              <p className="mt-1 text-base font-bold text-blue-600">{formatCurrency(stats.avg)}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Chart Type Selector */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Chart:</span>
              </div>
              {(["area", "line", "bar", "combined", "volume"] as ChartType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={chartType === type ? "default" : "outline"}
                  onClick={() => setChartType(type)}
                  className="text-xs capitalize"
                >
                  {type === "combined" ? "Area+Vol" : type}
                </Button>
              ))}
            </div>

            {/* Time Range Selector */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Range:</span>
              </div>
              {(["all", "3m", "6m", "1y"] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? "default" : "outline"}
                  onClick={() => setTimeRange(range)}
                  className="text-xs"
                >
                  {range === "all" ? "All Time" : range.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div style={{ width: "100%", height: "420px" }} className="bg-slate-50 rounded-lg border border-slate-200">
          {chartType === "area" && <AreaChartView data={filteredData} stats={stats} />}
          {chartType === "line" && <LineChartView data={filteredData} stats={stats} />}
          {chartType === "bar" && <BarChartView data={filteredData} />}
          {chartType === "combined" && <CombinedChartView data={filteredData} />}
          {chartType === "volume" && <VolumeChartView data={filteredData} />}
        </div>

        {/* Additional Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs text-slate-600">7-Day MA</p>
            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(stats.ma7)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs text-slate-600">14-Day MA</p>
            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(stats.ma14)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs text-slate-600">Total Range</p>
            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(stats.high - stats.low)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <p className="text-xs text-blue-600">Invested Days</p>
            <p className="mt-1 font-semibold text-blue-900">{filteredData.filter((d) => d.investedAmount > 0).length}</p>
          </div>
          <div className="rounded-lg bg-orange-50 p-3 border border-orange-200">
            <p className="text-xs text-orange-600">Wasted Days</p>
            <p className="mt-1 font-semibold text-orange-900">{filteredData.filter((d) => d.wastedAmount > 0).length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
