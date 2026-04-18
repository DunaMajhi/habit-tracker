import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ValuationChartEnhanced } from "@/components/dashboard/valuation-chart-enhanced";
import { CompanyStatusCard } from "@/components/dashboard/company-status-card";
import { MLInsightsCard } from "@/components/dashboard/ml-insights-card";
import { AuthForm } from "@/components/dashboard/auth-form";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const { transactions, metrics, series, mlInsights, errorMessage, authRequired, userEmail } =
    await getDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <Badge variant="secondary" className="bg-slate-900 text-white">
            Personal Company Simulator
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Company Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Track your personal company like a real business. Growth spending builds
            valuation, waste destroys it faster, and inactivity triggers decay.
          </p>
          <DashboardNav />
          {!authRequired && userEmail ? (
            <div className="flex flex-col gap-3 space-y-0 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <span className="truncate">Signed in as {userEmail}</span>
              <div className="flex gap-2">
                <Link href="/settings">
                  <button className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition sm:w-auto">
                    Settings
                  </button>
                </Link>
                <SignOutButton />
              </div>
            </div>
          ) : null}
        </header>

        {authRequired ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-900">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-amber-800">
              <p>Please sign in to view and manage your personal valuation ledger.</p>
              <AuthForm />
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Data Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800">{errorMessage}</CardContent>
          </Card>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <CompanyStatusCard metrics={metrics} />
            <SummaryCards metrics={metrics} />
            <ValuationChartEnhanced data={series} />
          </div>

          <div className="space-y-6">
            <MLInsightsCard insights={mlInsights} />
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>Use the Transactions page to add spending or growth events.</p>
                <Link href="/transactions" className="block rounded-lg bg-slate-900 px-4 py-3 text-center font-medium text-white transition hover:bg-slate-800">
                  Open Transactions
                </Link>
                <Link href="/insights" className="block rounded-lg border border-slate-300 px-4 py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50">
                  Open Insights
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <LedgerTable
          transactions={transactions}
          emptyMessage="No transactions yet. Use the Transactions page to create your first record."
        />
      </main>
    </div>
  );
}
