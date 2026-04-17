import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { ExportDataButton } from "@/components/settings/export-data-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  if (!getSupabaseConfig()) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
        <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Configuration Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800">
              Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
        <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Server Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800">
              Failed to initialize Supabase server client.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/");
  }

  const userEmail = session.user.email || "unknown";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200">
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-slate-900 text-white">
              Personal Valuation Tracker
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Account Settings
            </h1>
            <p className="text-sm text-slate-600">Manage your account and preferences.</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Email</p>
              <p className="text-sm text-slate-900">{userEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Member Since</p>
              <p className="text-sm text-slate-900">
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "long",
                }).format(new Date(session.user.created_at || new Date()))}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle>Export Your Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Download all your transactions as a CSV file. This includes a summary of your totals.
            </p>
            <ExportDataButton />
          </CardContent>
        </Card>

        {/* Change Password */}
        <ChangePasswordForm userEmail={userEmail} />

        {/* Delete Account */}
        <DeleteAccountSection userEmail={userEmail} />
      </main>
    </div>
  );
}
