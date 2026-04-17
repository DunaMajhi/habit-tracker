"use client";

import { useState } from "react";
import { generateTransactionsCSV } from "@/app/settings/export-action";
import { Button } from "@/components/ui/button";

export function ExportDataButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    setExportSuccess(null);
    setIsExporting(true);

    try {
      const result = await generateTransactionsCSV();

      if (!result.success) {
        setExportError(result.error || "Failed to generate CSV.");
        setIsExporting(false);
        return;
      }

      if (!result.csv) {
        setExportError("No CSV data generated.");
        setIsExporting(false);
        return;
      }

      // Create blob and download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      link.setAttribute("href", url);
      link.setAttribute("download", `valuation-tracker-export-${timestamp}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess("Transactions exported successfully.");
      setIsExporting(false);

      // Clear success message after 3 seconds
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
      >
        {isExporting ? "Exporting..." : "Download CSV"}
      </Button>

      {exportError ? <p className="text-sm text-red-600">{exportError}</p> : null}
      {exportSuccess ? <p className="text-sm text-emerald-600">{exportSuccess}</p> : null}
    </div>
  );
}
