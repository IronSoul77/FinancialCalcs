import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { chooseBestPlan, runMonteCarlo } from "@/lib/optimizer/engine";
import { currency } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import type { OptimizerInput } from "@/lib/optimizer/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [income, expenses, emergency, loans] = await Promise.all([
    supabase.from("income_sources").select("*").eq("user_id", user!.id),
    supabase.from("expenses").select("*").eq("user_id", user!.id),
    supabase.from("emergency_settings").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("loans").select("*").eq("user_id", user!.id)
  ]);
  const input: OptimizerInput = { incomeSources: income.data ?? [], expenses: expenses.data ?? [], emergencyRule: emergency.data, loans: loans.data ?? [] };
  const { winner, interestSavedVsMinimum } = chooseBestPlan(input);
  const monteCarlo = runMonteCarlo(input);
  const required = input.expenses.filter((expense) => expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const optional = input.expenses.filter((expense) => !expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const firstTarget = winner.schedule.find((row) => row.extraPayment > 0)?.loanName ?? "Add loan data";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-600">Projected figures based on information provided.</p>
        </div>
        <Link href="/setup" className="btn-secondary">Update Setup</Link>
      </div>
      {input.incomeSources.length === 0 || input.loans.length === 0 ? (
        <div className="card">
          <p className="font-semibold">Finish setup to generate a full plan.</p>
          <p className="mt-1 text-sm text-slate-600">Add income, emergency settings, required expenses, and loans.</p>
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Monthly income" value={currency(winner.monthlyIncome)} />
        <StatCard title="Required expenses" value={currency(required)} />
        <StatCard title="Optional expenses" value={currency(optional)} />
        <StatCard title="Emergency contribution" value={currency(winner.monthlyEmergencySavings)} tone="safe" />
        <StatCard title="Minimum loan payments" value={currency(winner.monthlyMinimumPayments)} />
        <StatCard title="Leftover after required items" value={currency(winner.monthlyIncome - required - winner.monthlyMinimumPayments)} />
        <StatCard title="Recommended extra payment" value={currency(winner.monthlyExtraPayment)} tone={winner.monthlyExtraPayment > 0 ? "safe" : "warning"} />
        <StatCard title="Attack first" value={firstTarget} tone="urgent" />
        <StatCard title="Estimated debt free date" value={winner.debtFreeDate ?? "Not reached"} />
        <StatCard title="Estimated total interest" value={currency(winner.totalInterestPaid)} />
        <StatCard title="Estimated interest saved" value={currency(interestSavedVsMinimum)} tone="paid" />
        <StatCard title="Monte Carlo plan confidence" value={`${monteCarlo.probabilityOnPlan}%`} help={`Risk level: ${monteCarlo.riskLevel}`} />
      </section>
      {winner.warnings.length ? (
        <section className="grid gap-3">
          {winner.warnings.map((warning) => <div key={warning} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{warning}</div>)}
        </section>
      ) : null}
    </div>
  );
}
