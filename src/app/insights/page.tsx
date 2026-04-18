import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { CompanyStatusCard } from "@/components/dashboard/company-status-card";
import { MLInsightsCard } from "@/components/dashboard/ml-insights-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ValuationChartEnhanced } from "@/components/dashboard/valuation-chart-enhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function InsightsPage() {
  const { metrics, series, mlInsights, errorMessage, authRequired, userEmail } = await getDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Insights</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Review the company state, model forecast, and valuation trend in one focused place.
          </p>
          <DashboardNav />
          {!authRequired && userEmail ? (
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
              Signed in as {userEmail}
            </div>
          ) : null}
        </header>

        {errorMessage ? (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Data Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800">{errorMessage}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <CompanyStatusCard metrics={metrics} />
            <MLInsightsCard insights={mlInsights} />
          </div>
          <div className="space-y-6">
            <SummaryCards metrics={metrics} />
            <ValuationChartEnhanced data={series} />
          </div>
        </div>
      </main>
    </div>
  );
}