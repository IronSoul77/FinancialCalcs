"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chooseBestPlan } from "@/lib/optimizer/engine";
import type { OptimizerInput } from "@/lib/optimizer/types";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

const num = z.coerce.number().finite().min(0);
const day = z.coerce.number().int().min(1).max(31);
const formBoolean = z.enum(["true", "false"]).transform((value) => value === "true");

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await currentUser();
  await supabase.from("profiles").upsert({ id: user.id, name: String(formData.get("name") ?? "") });
  revalidatePath("/setup");
}

export async function saveIncome(formData: FormData) {
  const { supabase, user } = await currentUser();
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    amount: num,
    frequency: z.enum(["weekly", "biweekly", "twice_monthly", "monthly"]),
    pay_dates: z.string().optional(),
    is_fixed: formBoolean,
    is_guaranteed: formBoolean
  });
  const data = schema.parse(Object.fromEntries(formData));
  const id = data.id || undefined;
  await supabase.from("income_sources").upsert({ ...data, id, user_id: user.id });
  revalidatePath("/income");
  revalidatePath("/dashboard");
}

export async function deleteIncome(formData: FormData) {
  const { supabase } = await currentUser();
  await supabase.from("income_sources").delete().eq("id", String(formData.get("id")));
  revalidatePath("/income");
}

export async function saveExpense(formData: FormData) {
  const { supabase, user } = await currentUser();
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    amount: num,
    category: z.string().min(1),
    due_day: day,
    is_required: formBoolean
  });
  const data = schema.parse(Object.fromEntries(formData));
  await supabase.from("expenses").upsert({ ...data, id: data.id || undefined, user_id: user.id });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await currentUser();
  await supabase.from("expenses").delete().eq("id", String(formData.get("id")));
  revalidatePath("/expenses");
}

export async function saveEmergencySettings(formData: FormData) {
  const { supabase, user } = await currentUser();
  const schema = z.object({
    id: z.string().optional(),
    current_savings: num,
    target_savings: num,
    mode: z.enum(["safe", "balanced", "aggressive"]),
    monthly_amount: z.coerce.number().optional().nullable(),
    monthly_percentage: z.coerce.number().optional().nullable(),
    auto_calculate: formBoolean
  });
  const data = schema.parse(Object.fromEntries(formData));
  await supabase.from("emergency_settings").upsert({ ...data, id: data.id || undefined, user_id: user.id });
  revalidatePath("/settings");
  revalidatePath("/setup");
  revalidatePath("/dashboard");
}

export async function saveLoan(formData: FormData) {
  const { supabase, user } = await currentUser();
  const schema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    loan_type: z.string().min(1),
    current_balance: num,
    original_principal: num,
    apr: num,
    interest_type: z.enum(["fixed", "variable"]),
    minimum_payment: num,
    due_day: day,
    amount_paid_so_far: num,
    late_fee: z.coerce.number().optional().nullable(),
    prepayment_penalty: z.coerce.number().optional().nullable(),
    promo_apr_end_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  });
  const data = schema.parse(Object.fromEntries(formData));
  await supabase.from("loans").upsert({
    ...data,
    id: data.id || undefined,
    user_id: user.id,
    promo_apr_end_date: data.promo_apr_end_date || null,
    notes: data.notes || null
  });
  revalidatePath("/loans");
  revalidatePath("/dashboard");
}

export async function deleteLoan(formData: FormData) {
  const { supabase } = await currentUser();
  await supabase.from("loans").delete().eq("id", String(formData.get("id")));
  revalidatePath("/loans");
}

export async function savePayment(formData: FormData) {
  const { supabase, user } = await currentUser();
  const schema = z.object({
    id: z.string().optional(),
    loan_id: z.string().uuid(),
    payment_date: z.string().min(1),
    amount: num,
    extra_amount: num,
    interest_paid: num,
    principal_paid: num
  });
  const data = schema.parse(Object.fromEntries(formData));
  await supabase.from("payments").upsert({ ...data, id: data.id || undefined, user_id: user.id });
  revalidatePath("/loans");
}

export async function deletePayment(formData: FormData) {
  const { supabase } = await currentUser();
  await supabase.from("payments").delete().eq("id", String(formData.get("id")));
  revalidatePath("/loans");
}

export async function regeneratePlan() {
  const { supabase, user } = await currentUser();
  const [income, expenses, emergency, loans] = await Promise.all([
    supabase.from("income_sources").select("*").eq("user_id", user.id),
    supabase.from("expenses").select("*").eq("user_id", user.id),
    supabase.from("emergency_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("loans").select("*").eq("user_id", user.id)
  ]);

  const input: OptimizerInput = {
    incomeSources: income.data ?? [],
    expenses: expenses.data ?? [],
    emergencyRule: emergency.data,
    loans: loans.data ?? []
  };
  const { winner, interestSavedVsMinimum } = chooseBestPlan(input);
  await supabase.from("repayment_plan_months").delete().eq("user_id", user.id);
  await supabase.from("repayment_plans").delete().eq("user_id", user.id);
  const { data: plan } = await supabase.from("repayment_plans").insert({
    user_id: user.id,
    strategy_name: winner.strategyName,
    monthly_income: winner.monthlyIncome,
    monthly_expenses: winner.monthlyExpenses,
    monthly_emergency_savings: winner.monthlyEmergencySavings,
    monthly_minimum_payments: winner.monthlyMinimumPayments,
    monthly_extra_payment: winner.monthlyExtraPayment,
    total_interest_paid: winner.totalInterestPaid,
    interest_saved_vs_minimum: interestSavedVsMinimum,
    debt_free_date: winner.debtFreeDate
  }).select("id").single();

  if (plan?.id) {
    await supabase.from("repayment_plan_months").insert(winner.schedule.map((row) => ({
      plan_id: plan.id,
      user_id: user.id,
      month_number: row.monthNumber,
      month_date: row.monthDate,
      loan_id: row.loanId,
      starting_balance: row.startingBalance,
      interest_charged: row.interestCharged,
      minimum_payment: row.minimumPayment,
      extra_payment: row.extraPayment,
      ending_balance: row.endingBalance
    })));
  }
  revalidatePath("/optimizer");
  revalidatePath("/schedule");
  redirect("/optimizer");
}
