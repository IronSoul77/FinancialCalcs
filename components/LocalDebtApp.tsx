"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { chooseBestPlan, runMonteCarlo } from "@/lib/optimizer/engine";
import { expenseCategories, loanTypes } from "@/lib/constants";
import { currency, percent } from "@/lib/format";
import type { EmergencySettings, Expense, Frequency, IncomeSource, InterestType, Loan } from "@/lib/types/database";
import type { OptimizerInput } from "@/lib/optimizer/types";

type View = "dashboard" | "setup" | "income" | "expenses" | "loans" | "optimizer" | "schedule" | "settings";

type LocalState = {
  name: string;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  emergency: EmergencySettings;
  loans: Loan[];
};

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const emptyState = (): LocalState => ({
  name: "",
  incomeSources: [],
  expenses: [],
  emergency: {
    id: "local-emergency",
    user_id: "local",
    current_savings: 0,
    target_savings: 1000,
    mode: "balanced",
    monthly_amount: null,
    monthly_percentage: null,
    auto_calculate: true,
    created_at: now(),
    updated_at: now()
  },
  loans: []
});

export function LocalDebtApp({ view = "dashboard" }: { view?: View }) {
  const [state, setState] = useState<LocalState>(() => emptyState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("smart-debt-optimizer");
    if (saved) setState({ ...emptyState(), ...JSON.parse(saved) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem("smart-debt-optimizer", JSON.stringify(state));
  }, [loaded, state]);

  const input: OptimizerInput = useMemo(() => ({
    incomeSources: state.incomeSources,
    expenses: state.expenses,
    emergencyRule: state.emergency,
    loans: state.loans
  }), [state]);
  const plan = useMemo(() => chooseBestPlan(input), [input]);
  const stress = useMemo(() => state.loans.length ? runMonteCarlo(input) : null, [input, state.loans.length]);
  const required = state.expenses.filter((expense) => expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const optional = state.expenses.filter((expense) => !expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const firstTarget = plan.winner.schedule.find((row) => row.extraPayment > 0)?.loanName ?? "Add loan data";

  const addIncome = (form: FormData) => setState((current) => ({
    ...current,
    incomeSources: [...current.incomeSources, {
      id: id(),
      user_id: "local",
      name: String(form.get("name") || "Income"),
      amount: Number(form.get("amount") || 0),
      frequency: String(form.get("frequency") || "monthly") as Frequency,
      pay_dates: String(form.get("pay_dates") || ""),
      is_fixed: form.get("is_fixed") === "true",
      is_guaranteed: form.get("is_guaranteed") === "true",
      created_at: now(),
      updated_at: now()
    }]
  }));

  const addExpense = (form: FormData) => setState((current) => ({
    ...current,
    expenses: [...current.expenses, {
      id: id(),
      user_id: "local",
      name: String(form.get("name") || "Expense"),
      amount: Number(form.get("amount") || 0),
      category: String(form.get("category") || "Other"),
      due_day: Number(form.get("due_day") || 1),
      is_required: form.get("is_required") === "true",
      created_at: now(),
      updated_at: now()
    }]
  }));

  const addLoan = (form: FormData) => setState((current) => ({
    ...current,
    loans: [...current.loans, {
      id: id(),
      user_id: "local",
      name: String(form.get("name") || "Loan"),
      loan_type: String(form.get("loan_type") || "Other"),
      current_balance: Number(form.get("current_balance") || 0),
      original_principal: Number(form.get("original_principal") || form.get("current_balance") || 0),
      apr: Number(form.get("apr") || 0),
      interest_type: String(form.get("interest_type") || "fixed") as InterestType,
      minimum_payment: Number(form.get("minimum_payment") || 0),
      due_day: Number(form.get("due_day") || 1),
      amount_paid_so_far: Number(form.get("amount_paid_so_far") || 0),
      late_fee: Number(form.get("late_fee") || 0),
      prepayment_penalty: Number(form.get("prepayment_penalty") || 0),
      promo_apr_end_date: String(form.get("promo_apr_end_date") || "") || null,
      notes: String(form.get("notes") || "") || null,
      created_at: now(),
      updated_at: now()
    }]
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Debt Optimizer</h1>
          <p className="text-slate-600">No login needed. Your planner data is saved in this browser.</p>
        </div>
        <button className="btn-secondary" onClick={() => setState(emptyState())}>Clear Local Data</button>
      </div>
      <nav className="flex flex-wrap gap-2">
        {(["dashboard", "setup", "income", "expenses", "loans", "optimizer", "schedule", "settings"] as View[]).map((item) => (
          <Link key={item} href={`/${item === "dashboard" ? "dashboard" : item}`} className={`rounded-md px-3 py-2 text-sm font-semibold ${view === item ? "bg-teal-700 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>{item}</Link>
        ))}
      </nav>

      {(view === "dashboard" || view === "optimizer") ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Monthly income" value={currency(plan.winner.monthlyIncome)} />
            <Metric label="Required expenses" value={currency(required)} />
            <Metric label="Optional expenses" value={currency(optional)} />
            <Metric label="Emergency contribution" value={currency(plan.winner.monthlyEmergencySavings)} />
            <Metric label="Minimum loan payments" value={currency(plan.winner.monthlyMinimumPayments)} />
            <Metric label="Recommended extra payment" value={currency(plan.winner.monthlyExtraPayment)} />
            <Metric label="Attack first" value={firstTarget} />
            <Metric label="Debt free date" value={plan.winner.debtFreeDate ?? "Not reached"} />
            <Metric label="Winning strategy" value={plan.winner.strategyName} />
            <Metric label="Total interest" value={currency(plan.winner.totalInterestPaid)} />
            <Metric label="Interest saved" value={currency(plan.interestSavedVsMinimum)} />
            <Metric label="Stress confidence" value={stress ? `${stress.probabilityOnPlan}%` : "Add loans"} />
          </section>
          {plan.winner.warnings.map((warning) => <div key={warning} className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">{warning}</div>)}
          <Comparison results={plan.results} />
        </>
      ) : null}

      {(view === "setup" || view === "income") ? <IncomeSection addIncome={addIncome} rows={state.incomeSources} remove={(rowId) => setState((s) => ({ ...s, incomeSources: s.incomeSources.filter((row) => row.id !== rowId) }))} /> : null}
      {(view === "setup" || view === "expenses") ? <ExpenseSection addExpense={addExpense} rows={state.expenses} remove={(rowId) => setState((s) => ({ ...s, expenses: s.expenses.filter((row) => row.id !== rowId) }))} /> : null}
      {(view === "setup" || view === "settings") ? <EmergencySection state={state} setState={setState} /> : null}
      {(view === "setup" || view === "loans") ? <LoanSection addLoan={addLoan} rows={state.loans} remove={(rowId) => setState((s) => ({ ...s, loans: s.loans.filter((row) => row.id !== rowId) }))} /> : null}
      {view === "schedule" ? <Schedule rows={plan.winner.schedule} /> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}

function LocalForm({ action, children, button }: { action: (form: FormData) => void; children: ReactNode; button: string }) {
  return <form className="card grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); action(new FormData(event.currentTarget)); event.currentTarget.reset(); }}>{children}<button className="btn-primary md:col-span-2" type="submit">{button}</button></form>;
}

function IncomeSection({ addIncome, rows, remove }: { addIncome: (form: FormData) => void; rows: IncomeSource[]; remove: (id: string) => void }) {
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Income</h2><LocalForm action={addIncome} button="Add Income"><Field label="Name"><input name="name" defaultValue="Primary salary" required /></Field><Field label="Amount"><input name="amount" type="number" min="0" step="0.01" required /></Field><Field label="Frequency"><select name="frequency" defaultValue="monthly"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="twice_monthly">Twice a month</option><option value="monthly">Monthly</option></select></Field><Field label="Pay dates"><input name="pay_dates" placeholder="1st and 15th" /></Field><Field label="Income type"><select name="is_fixed" defaultValue="true"><option value="true">Fixed</option><option value="false">Variable</option></select></Field><Field label="Reliability"><select name="is_guaranteed" defaultValue="true"><option value="true">Guaranteed</option><option value="false">Uncertain</option></select></Field></LocalForm><SimpleTable rows={rows.map((row) => [row.id, row.name, currency(row.amount), row.frequency])} remove={remove} /></section>;
}

function ExpenseSection({ addExpense, rows, remove }: { addExpense: (form: FormData) => void; rows: Expense[]; remove: (id: string) => void }) {
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Expenses</h2><LocalForm action={addExpense} button="Add Expense"><Field label="Name"><input name="name" required /></Field><Field label="Amount"><input name="amount" type="number" min="0" step="0.01" required /></Field><Field label="Due day"><input name="due_day" type="number" min="1" max="31" defaultValue={1} /></Field><Field label="Category"><select name="category">{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Type"><select name="is_required" defaultValue="true"><option value="true">Required</option><option value="false">Optional</option></select></Field></LocalForm><SimpleTable rows={rows.map((row) => [row.id, row.name, currency(row.amount), row.category, row.is_required ? "Required" : "Optional"])} remove={remove} /></section>;
}

function EmergencySection({ state, setState }: { state: LocalState; setState: React.Dispatch<React.SetStateAction<LocalState>> }) {
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Emergency Savings</h2><form className="card grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setState((current) => ({ ...current, emergency: { ...current.emergency, current_savings: Number(form.get("current_savings") || 0), target_savings: Number(form.get("target_savings") || 0), mode: String(form.get("mode") || "balanced") as EmergencySettings["mode"], auto_calculate: form.get("auto_calculate") === "true", monthly_amount: Number(form.get("monthly_amount") || 0), monthly_percentage: Number(form.get("monthly_percentage") || 0), updated_at: now() } })); }}><Field label="Current savings"><input name="current_savings" type="number" min="0" step="0.01" defaultValue={state.emergency.current_savings} /></Field><Field label="Keep untouched"><input name="target_savings" type="number" min="0" step="0.01" defaultValue={state.emergency.target_savings} /></Field><Field label="Automatic"><select name="auto_calculate" defaultValue={String(state.emergency.auto_calculate)}><option value="true">Let app choose</option><option value="false">Use my amount</option></select></Field><Field label="Mode"><select name="mode" defaultValue={state.emergency.mode}><option value="safe">Safe</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></select></Field><Field label="Monthly amount"><input name="monthly_amount" type="number" min="0" step="0.01" defaultValue={state.emergency.monthly_amount ?? 0} /></Field><Field label="Monthly percentage"><input name="monthly_percentage" type="number" min="0" max="100" step="0.1" defaultValue={state.emergency.monthly_percentage ?? 0} /></Field><button className="btn-primary md:col-span-2">Save Emergency Settings</button></form></section>;
}

function LoanSection({ addLoan, rows, remove }: { addLoan: (form: FormData) => void; rows: Loan[]; remove: (id: string) => void }) {
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Loans</h2><LocalForm action={addLoan} button="Add Loan"><Field label="Name"><input name="name" required /></Field><Field label="Type"><select name="loan_type">{loanTypes.map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Current balance"><input name="current_balance" type="number" min="0" step="0.01" required /></Field><Field label="Original principal"><input name="original_principal" type="number" min="0" step="0.01" /></Field><Field label="APR"><input name="apr" type="number" min="0" step="0.01" required /></Field><Field label="Interest type"><select name="interest_type"><option value="fixed">Fixed</option><option value="variable">Variable</option></select></Field><Field label="Minimum payment"><input name="minimum_payment" type="number" min="0" step="0.01" required /></Field><Field label="Due day"><input name="due_day" type="number" min="1" max="31" defaultValue={1} /></Field><Field label="Amount paid"><input name="amount_paid_so_far" type="number" min="0" step="0.01" defaultValue={0} /></Field><Field label="Late fee"><input name="late_fee" type="number" min="0" step="0.01" defaultValue={0} /></Field><Field label="Prepayment penalty"><input name="prepayment_penalty" type="number" min="0" step="0.01" defaultValue={0} /></Field><Field label="Promo APR end"><input name="promo_apr_end_date" type="date" /></Field><Field label="Notes"><textarea name="notes" /></Field></LocalForm><SimpleTable rows={rows.map((row) => [row.id, row.name, currency(row.current_balance), percent(row.apr), currency(row.minimum_payment)])} remove={remove} /></section>;
}

function Comparison({ results }: { results: ReturnType<typeof chooseBestPlan>["results"] }) {
  return <section className="card overflow-x-auto"><h2 className="mb-4 text-lg font-semibold">Strategy Comparison</h2><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Strategy</th><th>Interest</th><th>Months</th><th>Debt free date</th></tr></thead><tbody>{results.map((row) => <tr key={row.strategyName} className="border-b last:border-0"><td className="py-3 capitalize">{row.strategyName}</td><td>{currency(row.totalInterestPaid)}</td><td>{row.totalMonths}</td><td>{row.debtFreeDate ?? "Not reached"}</td></tr>)}</tbody></table></section>;
}

function Schedule({ rows }: { rows: ReturnType<typeof chooseBestPlan>["winner"]["schedule"] }) {
  return <section className="card overflow-x-auto"><h2 className="mb-4 text-lg font-semibold">Month By Month Schedule</h2><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Month</th><th>Loan</th><th>Start</th><th>Interest</th><th>Minimum</th><th>Extra</th><th>End</th><th>Buffer</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.monthNumber}-${row.loanId}`} className="border-b last:border-0"><td className="py-3">{row.monthNumber}</td><td>{row.loanName}</td><td>{currency(row.startingBalance)}</td><td>{currency(row.interestCharged)}</td><td>{currency(row.minimumPayment)}</td><td>{currency(row.extraPayment)}</td><td>{currency(row.endingBalance)}</td><td>{currency(row.remainingCashBuffer)}</td></tr>)}</tbody></table>{!rows.length ? <p className="py-6 text-center text-sm text-slate-500">Add income and loans to generate a schedule.</p> : null}</section>;
}

function SimpleTable({ rows, remove }: { rows: string[][]; remove: (id: string) => void }) {
  return <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><tbody>{rows.map(([rowId, ...cells]) => <tr key={rowId} className="border-b last:border-0">{cells.map((cell, index) => <td key={index} className="py-3 pr-4">{cell}</td>)}<td><button className="btn-secondary py-1" onClick={() => remove(rowId)}>Delete</button></td></tr>)}</tbody></table>{!rows.length ? <p className="py-6 text-center text-sm text-slate-500">Nothing added yet.</p> : null}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label>{label}</label>{children}</div>;
}
