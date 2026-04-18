import Link from "next/link";
import { calculateValuation } from "@/utils/valuation-company";
import type { Transaction, TransactionCategory, ValuationMetrics } from "@/types/valuation";
import { GROWTH_CATEGORIES, WASTE_CATEGORIES } from "@/types/valuation";
import { buildValuationSeries, type ValuationSeriesPoint } from "@/lib/valuation-series";
import { generateMLInsights, type MLInsights } from "@/lib/ml-insights";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { ValuationChartEnhanced } from "@/components/dashboard/valuation-chart-enhanced";
import { CompanyStatusCard } from "@/components/dashboard/company-status-card";
import { MLInsightsCard } from "@/components/dashboard/ml-insights-card";
import { AuthForm } from "@/components/dashboard/auth-form";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  transactions: Transaction[];
  metrics: ValuationMetrics;
  series: ValuationSeriesPoint[];
  mlInsights: MLInsights;
  errorMessage: string | null;
  authRequired: boolean;
  userEmail: string | null;
}

interface TransactionRow {
  id: string;
  amount: number | string;
  category: string;
  description: string;
  timestamp: string;
}

function mapSupabaseErrorMessage(message: string): string {
  if (message.includes("Could not find the table 'public.transactions'")) {
    return "Database schema is not set up yet. Run supabase/schema.sql in your Supabase SQL Editor to create public.transactions and RLS policies.";
  }

  return message;
}

const categorySet = new Set<string>([...GROWTH_CATEGORIES, ...WASTE_CATEGORIES]);

function isTransactionCategory(value: string): value is TransactionCategory {
  return categorySet.has(value);
}

function normalizeTransactionRows(rows: TransactionRow[]): Transaction[] {
  const normalized: Transaction[] = [];

  rows.forEach((row) => {
    if (!isTransactionCategory(row.category)) {
      return;
    }

    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    normalized.push({
      id: row.id,
      amount,
      category: row.category,
      description: row.description,
      timestamp: row.timestamp,
    });
  });

  return normalized;
}

function emptyMetrics(): ValuationMetrics {
  return calculateValuation([]);
}

async function getDashboardData(): Promise<DashboardData> {
  if (!getSupabaseConfig()) {
    return {
      transactions: [],
      metrics: emptyMetrics(),
      series: [],
      mlInsights: generateMLInsights([]),
      errorMessage:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      authRequired: false,
      userEmail: null,
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      transactions: [],
      metrics: emptyMetrics(),
      series: [],
      mlInsights: generateMLInsights([]),
      errorMessage: "Failed to initialize Supabase server client.",
      authRequired: false,
      userEmail: null,
    };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return {
      transactions: [],
      metrics: emptyMetrics(),
      series: [],
      mlInsights: generateMLInsights([]),
      errorMessage: sessionError.message,
      authRequired: false,
      userEmail: null,
    };
  }

  const user = session?.user;

  if (!user) {
    return {
      transactions: [],
      metrics: emptyMetrics(),
      series: [],
      mlInsights: generateMLInsights([]),
      errorMessage: null,
      authRequired: true,
      userEmail: null,
    };
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, category, description, timestamp")
    .order("timestamp", { ascending: true });

  if (error) {
    return {
      transactions: [],
      metrics: emptyMetrics(),
      series: [],
      mlInsights: generateMLInsights([]),
      errorMessage: mapSupabaseErrorMessage(error.message),
      authRequired: false,
      userEmail: user.email ?? null,
    };
  }

  const transactions = normalizeTransactionRows((data ?? []) as TransactionRow[]);
  const metrics = calculateValuation(transactions);
  const series = buildValuationSeries(transactions);
  const mlInsights = generateMLInsights(series);

  return {
    transactions,
    metrics,
    series,
    mlInsights,
    errorMessage: null,
    authRequired: false,
    userEmail: user.email ?? null,
  };
}

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

        <CompanyStatusCard metrics={metrics} />

        <MLInsightsCard insights={mlInsights} />

        <SummaryCards metrics={metrics} />

        <ValuationChartEnhanced data={series} />

        <TransactionForm disabled={authRequired} />

        <Card>
          <CardHeader>
            <CardTitle>Ledger Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No transactions yet. Use the form above to create your first record.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Date</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .slice()
                      .reverse()
                      .map((transaction) => (
                        <tr key={transaction.id} className="border-b border-slate-100">
                          <td className="py-2 text-slate-600">
                            {new Intl.DateTimeFormat("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(transaction.timestamp))}
                          </td>
                          <td className="py-2">
                            <Badge
                              variant={
                                (GROWTH_CATEGORIES as readonly string[]).includes(
                                  transaction.category
                                )
                                  ? "success"
                                  : (WASTE_CATEGORIES as readonly string[]).includes(
                                      transaction.category
                                    )
                                    ? "danger"
                                    : "secondary"
                              }
                            >
                              {transaction.category}
                            </Badge>
                          </td>
                          <td className="py-2 text-slate-700">{transaction.description}</td>
                          <td className="py-2 text-right font-medium text-slate-900">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 2,
                            }).format(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
