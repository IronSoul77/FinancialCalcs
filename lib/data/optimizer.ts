import { createClient } from "@/lib/supabase/server";
import { chooseBestPlan, runMonteCarlo } from "@/lib/optimizer/engine";
import type { OptimizerInput } from "@/lib/optimizer/types";

export async function loadOptimizerData(userId: string) {
  const supabase = await createClient();
  const [income, expenses, emergency, loans, latestPlan] = await Promise.all([
    supabase.from("income_sources").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("expenses").select("*").eq("user_id", userId).order("due_day"),
    supabase.from("emergency_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("loans").select("*").eq("user_id", userId).order("apr", { ascending: false }),
    supabase.from("repayment_plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  const input: OptimizerInput = {
    incomeSources: income.data ?? [],
    expenses: expenses.data ?? [],
    emergencyRule: emergency.data,
    loans: loans.data ?? []
  };
  const plan = chooseBestPlan(input);
  const monteCarlo = input.loans.length ? runMonteCarlo(input) : null;

  return {
    input,
    plan,
    monteCarlo,
    latestPlan: latestPlan.data,
    requiredExpenses: input.expenses.filter((expense) => expense.is_required).reduce((sum, expense) => sum + expense.amount, 0),
    optionalExpenses: input.expenses.filter((expense) => !expense.is_required).reduce((sum, expense) => sum + expense.amount, 0)
  };
}
