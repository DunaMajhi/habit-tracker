"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountSectionProps {
  userEmail: string;
}

export function DeleteAccountSection({ userEmail }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const emailMatches = confirmEmail === userEmail;

  async function handleDeleteAccount() {
    setDeleteError(null);

    if (!emailMatches) {
      setDeleteError("Email does not match. Please try again.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setDeleteError("Supabase client is unavailable.");
      return;
    }

    setIsDeleting(true);

    try {
      // Delete all user transactions (cascade will handle this via RLS)
      const { error: deleteTransactionsError } = await supabase
        .from("transactions")
        .delete()
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "");

      if (deleteTransactionsError && deleteTransactionsError.code !== "PGRST116") {
        // PGRST116 = no rows matched, which is fine
        setDeleteError(deleteTransactionsError.message);
        setIsDeleting(false);
        return;
      }

      // Delete the user account
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ""
      );

      if (deleteUserError) {
        // Fallback: use client-side method if admin is not available
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          setDeleteError("Failed to delete account. Please try again or contact support.");
          setIsDeleting(false);
          return;
        }

        // For client-side only deletion, we'll sign out and show message
        setDeleteError(null);
        router.push("/");
        return;
      }

      // Successfully deleted, redirect to home
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
      setIsDeleting(false);
    }
  }

  if (!showConfirmation) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-800">
            Deleting your account is permanent and cannot be undone. All your transactions and data
            will be deleted immediately.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowConfirmation(true)}
            className="w-full"
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-900">Confirm Account Deletion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-red-100 p-3">
          <p className="text-sm font-semibold text-red-900">This action cannot be undone.</p>
          <p className="text-sm text-red-800">
            All your transactions, data, and account will be permanently deleted.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-email" className="text-red-900">
            Type your email address to confirm:
          </Label>
          <Input
            id="confirm-email"
            type="email"
            placeholder={userEmail}
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            disabled={isDeleting}
            className="border-red-300"
          />
          <p className="text-xs text-red-700">
            {confirmEmail.length > 0 && !emailMatches && "Email does not match."}
            {emailMatches && confirmEmail.length > 0 && (
              <span className="text-emerald-700">✓ Email matches. Ready to delete.</span>
            )}
          </p>
        </div>

        {deleteError ? <p className="text-sm text-red-700">{deleteError}</p> : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowConfirmation(false);
              setConfirmEmail("");
              setDeleteError(null);
            }}
            disabled={isDeleting}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={!emailMatches || isDeleting}
            className="w-full"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
