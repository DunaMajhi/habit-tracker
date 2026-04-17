"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRANSACTION_CATEGORIES, type TransactionCategory } from "@/types/valuation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .refine((value) => Number.isFinite(value), "Amount must be a number.")
    .positive("Amount must be greater than zero."),
  category: z.enum(TRANSACTION_CATEGORIES),
  description: z
    .string()
    .trim()
    .min(2, "Description must be at least 2 characters.")
    .max(220, "Description must be at most 220 characters."),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;
type TransactionFormInput = z.input<typeof transactionSchema>;

interface TransactionFormProps {
  disabled?: boolean;
}

export function TransactionForm({ disabled = false }: TransactionFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const form = useForm<TransactionFormInput, undefined, TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      category: "Invested",
      description: "",
    },
  });

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: TransactionFormValues) {
    setSubmitError(null);
    setSubmitSuccess(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setSubmitError(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSubmitError("You must be signed in to add transactions.");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount: values.amount,
      category: values.category,
      description: values.description,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitSuccess("Transaction saved successfully.");
    reset({
      amount: 0,
      category: "Invested",
      description: "",
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              disabled={disabled || isSubmitting}
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? (
              <p className="text-xs text-red-600">{errors.amount.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              disabled={disabled || isSubmitting}
              value={watch("category")}
              onValueChange={(value) =>
                setValue("category", value as TransactionCategory, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category ? (
              <p className="text-xs text-red-600">{errors.category.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What was this transaction for?"
              disabled={disabled || isSubmitting}
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          {submitSuccess ? <p className="text-sm text-emerald-600">{submitSuccess}</p> : null}

          <Button type="submit" disabled={disabled || isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Save Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
