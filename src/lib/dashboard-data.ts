import { calculateValuation } from "@/utils/valuation-company";
import type { Transaction, TransactionCategory, ValuationMetrics } from "@/types/valuation";
import { GROWTH_CATEGORIES, WASTE_CATEGORIES } from "@/types/valuation";
import { buildValuationSeries, type ValuationSeriesPoint } from "@/lib/valuation-series";
import { generateMLInsights, type MLInsights } from "@/lib/ml-insights";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export interface DashboardData {
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

export async function getDashboardData(): Promise<DashboardData> {
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