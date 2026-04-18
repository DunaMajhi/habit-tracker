"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import type { ValuationMetrics } from "@/types/valuation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyStatusCardProps {
  metrics: ValuationMetrics;
}

export function CompanyStatusCard({ metrics }: CompanyStatusCardProps) {
  const getStatusColor = (status: string): string => {
    if (status === "Thriving") return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300";
    if (status === "AtRisk") return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300";
    if (status === "Critical") return "bg-gradient-to-r from-orange-50 to-red-50 border-orange-300";
    if (status === "Bankrupt") return "bg-gradient-to-r from-red-50 to-slate-50 border-red-400";
    return "bg-white border-slate-200";
  };

  const getStatusIcon = (status: string): string => {
    if (status === "Thriving") return "🚀";
    if (status === "AtRisk") return "⚠️";
    if (status === "Critical") return "🚨";
    if (status === "Bankrupt") return "💀";
    return "📊";
  };

  const getStatusMessage = (status: string, changePercent: number): string => {
    if (status === "Thriving") {
      return `Company is thriving! +${changePercent.toFixed(2)}% growth`;
    }
    if (status === "AtRisk") {
      return `Company at risk. ${changePercent.toFixed(2)}% loss detected.`;
    }
    if (status === "Critical") {
      return `⚠️ CRITICAL: ${changePercent.toFixed(2)}% loss! Invest urgently!`;
    }
    if (status === "Bankrupt") {
      return "Company has closed. Recovery required.";
    }
    return "Monitoring company status...";
  };

  const statusColorClass =
    metrics.companyStatus === "Thriving"
      ? "bg-green-600 hover:bg-green-700"
      : metrics.companyStatus === "AtRisk"
        ? "bg-yellow-600 hover:bg-yellow-700"
        : metrics.companyStatus === "Critical"
          ? "bg-orange-600 hover:bg-orange-700"
          : "bg-red-600 hover:bg-red-700";

  const cardTitle =
    metrics.companyStatus === "Bankrupt" ? "Company Closed" : "Company Status";

  return (
    <Card className={`border-2 ${getStatusColor(metrics.companyStatus)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getStatusIcon(metrics.companyStatus)}</span>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {cardTitle}
              </CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {getStatusMessage(metrics.companyStatus, metrics.valuationChangePercent)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`text-base px-4 py-2 ${statusColorClass}`}>
              {metrics.companyStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Health Meter */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Company Health</p>
            <p className="text-xl font-bold text-slate-900">
              {metrics.companyHealthPercent}%
            </p>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={
                metrics.companyHealthPercent > 50
                  ? "bg-green-500"
                  : metrics.companyHealthPercent > 25
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }
              style={{ width: `${Math.min(metrics.companyHealthPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Valuation Change */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-3 border border-slate-200">
            <p className="text-xs text-slate-600">Current Valuation</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              ₹{metrics.currentValuation.toLocaleString("en-IN")}
            </p>
          </div>
          <div
            className={`rounded-lg p-3 border ${
              metrics.valuationChangePercent >= 0
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-xs text-slate-600">Change from Base</p>
            <div className="mt-1 flex items-center gap-1">
              <span
                className={
                  metrics.valuationChangePercent >= 0
                    ? "text-xl font-bold text-green-600"
                    : "text-xl font-bold text-red-600"
                }
              >
                {metrics.valuationChangePercent >= 0
                  ? `+${metrics.valuationChangePercent.toFixed(2)}%`
                  : `${metrics.valuationChangePercent.toFixed(2)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {metrics.isNearBankruptcy && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Bankruptcy Warning!</p>
                <p className="text-sm text-red-800">
                  {metrics.daysToBankruptcy !== null
                    ? `Your company will close in approximately ${metrics.daysToBankruptcy} days if you don't invest in growth.`
                    : "Your company is at critical risk. Urgent action required!"}
                </p>
              </div>
            </div>
          </div>
        )}

        {metrics.decayAccelerated && (
          <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Accelerated Decay Active</p>
                <p className="text-sm text-orange-800">
                  Company is in negative state. Decay penalty increased to{" "}
                  {Math.round(metrics.decayPenaltyRate * 100)}%.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Growth vs Waste Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700">Total Growth</p>
            <p className="mt-1 font-bold text-green-900">
              ₹{metrics.totalGrowth.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-700">Total Waste</p>
            <p className="mt-1 font-bold text-red-900">
              ₹{metrics.totalWaste.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700">Ratio</p>
            <p className="mt-1 font-bold text-slate-900">
              {metrics.totalWaste > 0
                ? `${(metrics.totalGrowth / metrics.totalWaste).toFixed(2)}:1`
                : "∞:1"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
