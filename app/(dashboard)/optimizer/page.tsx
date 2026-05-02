import { regeneratePlan } from "@/app/actions/data";
import { OptimizerCharts } from "@/components/charts/OptimizerCharts";
import { StatCard } from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { loadOptimizerData } from "@/lib/data/optimizer";
import { currency } from "@/lib/format";

export default async function OptimizerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { input, plan, monteCarlo, requiredExpenses, optionalExpenses } = await loadOptimizerData(user!.id);
  const { winner, results, interestSavedVsMinimum } = plan;
  const cashFlow = [
    { name: "Income", amount: winner.monthlyIncome },
    { name: "Expenses", amount: -winner.monthlyExpenses },
    { name: "Emergency", amount: -winner.monthlyEmergencySavings },
    { name: "Minimums", amount: -winner.monthlyMinimumPayments },
    { name: "Extra debt", amount: -winner.monthlyExtraPayment }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimizer Results</h1>
          <p className="text-slate-600">The winning strategy is selected by lowest projected interest while respecting cash flow and savings rules.</p>
        </div>
        <form action={regeneratePlan}><button className="btn-primary" type="submit">Regenerate Plan</button></form>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Winning strategy" value={winner.strategyName} tone="safe" />
        <StatCard title="Monthly cash flow" value={currency(winner.monthlyIncome - winner.monthlyExpenses)} />
        <StatCard title="Available for debt payoff" value={currency(winner.monthlyExtraPayment)} />
        <StatCard title="Estimated debt free date" value={winner.debtFreeDate ?? "Not reached"} />
        <StatCard title="Estimated total interest" value={currency(winner.totalInterestPaid)} />
        <StatCard title="Interest saved" value={currency(interestSavedVsMinimum)} tone="paid" />
        <StatCard title="Required expenses" value={currency(requiredExpenses)} />
        <StatCard title="Optional expenses" value={currency(optionalExpenses)} />
      </section>
      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">Strategy Comparison</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Strategy</th><th>Total interest</th><th>Months</th><th>Debt free date</th><th>Extra payment</th></tr></thead>
          <tbody>{results.map((result) => <tr key={result.strategyName} className="border-b last:border-0"><td className="py-3 font-semibold capitalize">{result.strategyName}</td><td>{currency(result.totalInterestPaid)}</td><td>{result.totalMonths}</td><td>{result.debtFreeDate ?? "Not reached"}</td><td>{currency(result.monthlyExtraPayment)}</td></tr>)}</tbody>
        </table>
      </section>
      {monteCarlo ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Stay on plan probability" value={`${monteCarlo.probabilityOnPlan}%`} />
          <StatCard title="Best case" value={`${monteCarlo.bestCaseMonths} months`} />
          <StatCard title="Expected case" value={`${monteCarlo.expectedMonths} months`} />
          <StatCard title="Worst case" value={`${monteCarlo.worstCaseMonths} months`} />
          <StatCard title="Stress risk" value={monteCarlo.riskLevel} tone={monteCarlo.riskLevel === "high" ? "urgent" : monteCarlo.riskLevel === "medium" ? "warning" : "safe"} />
        </section>
      ) : null}
      {input.loans.length ? <OptimizerCharts result={winner} cashFlow={cashFlow} /> : <div className="card text-sm text-slate-600">Add loans to see charts and optimizer output.</div>}
    </div>
  );
}
