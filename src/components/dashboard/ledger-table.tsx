import type { Transaction } from "@/types/valuation";
import { GROWTH_CATEGORIES, WASTE_CATEGORIES } from "@/types/valuation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LedgerTableProps {
  transactions: Transaction[];
  title?: string;
  emptyMessage?: string;
}

export function LedgerTable({
  transactions,
  title = "Ledger Snapshot",
  emptyMessage = "No transactions yet.",
}: LedgerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
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
                {transactions.slice().reverse().map((transaction) => (
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
                          (GROWTH_CATEGORIES as readonly string[]).includes(transaction.category)
                            ? "success"
                            : (WASTE_CATEGORIES as readonly string[]).includes(transaction.category)
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
  );
}