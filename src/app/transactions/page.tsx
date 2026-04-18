import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function TransactionsPage() {
  const { transactions, errorMessage, authRequired, userEmail } = await getDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Transactions</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Add growth investments and waste events here. This page keeps the action focused.
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

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <TransactionForm disabled={authRequired} />
          <LedgerTable
            transactions={transactions}
            title="Transaction Ledger"
            emptyMessage="No transactions yet. Add one on the left."
          />
        </div>
      </main>
    </div>
  );
}