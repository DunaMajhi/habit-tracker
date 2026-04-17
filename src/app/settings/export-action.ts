"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface TransactionRecord {
  id: string;
  amount: number | string;
  category: string;
  description: string;
  timestamp: string;
}

export async function generateTransactionsCSV(): Promise<{
  success: boolean;
  csv?: string;
  error?: string;
}> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Supabase client is unavailable.",
    };
  }

  // Get authenticated user
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      success: false,
      error: "You must be signed in to export data.",
    };
  }

  // Fetch all user transactions
  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, category, description, timestamp, created_at")
    .eq("user_id", session.user.id)
    .order("timestamp", { ascending: false });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      success: false,
      error: "No transactions found to export.",
    };
  }

  // Build CSV header
  const headers = ["Date & Time", "Category", "Amount (INR)", "Description", "Transaction ID"];
  const csvLines: string[] = [headers.map((h) => `"${h}"`).join(",")];

  // Build CSV rows
  const transactions = data as TransactionRecord[];
  transactions.forEach((transaction) => {
    const date = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(transaction.timestamp));

    const amount = Number(transaction.amount).toFixed(2);
    const description = String(transaction.description || "").replace(/"/g, '""'); // Escape quotes

    const row = [
      `"${date}"`,
      `"${transaction.category}"`,
      `"${amount}"`,
      `"${description}"`,
      `"${transaction.id}"`,
    ].join(",");

    csvLines.push(row);
  });

  // Add summary row
  const totalInvested = transactions
    .filter((t) => t.category === "Invested")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalWasted = transactions
    .filter((t) => t.category === "Wasted")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOpEx = transactions
    .filter((t) => t.category === "OpEx")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  csvLines.push(""); // Empty line
  csvLines.push(`"Summary:","","","",""`);
  csvLines.push(`"Total Invested","","${totalInvested.toFixed(2)}","",""`, );
  csvLines.push(`"Total Wasted","","${totalWasted.toFixed(2)}","","""`);
  csvLines.push(`"Total OpEx","","${totalOpEx.toFixed(2)}","",""`);

  const csv = csvLines.join("\n");

  return {
    success: true,
    csv,
  };
}
