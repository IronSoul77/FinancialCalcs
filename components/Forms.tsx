import type { ReactNode } from "react";
import { saveExpense, saveIncome, saveLoan, saveEmergencySettings, savePayment } from "@/app/actions/data";
import { expenseCategories, loanTypes } from "@/lib/constants";
import type { EmergencySettings, Expense, IncomeSource, Loan, Payment } from "@/lib/types/database";

export function IncomeForm({ income }: { income?: Partial<IncomeSource> }) {
  return (
    <form action={saveIncome} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={income?.id ?? ""} />
      <Field label="Income name"><input name="name" defaultValue={income?.name ?? "Primary salary"} required /></Field>
      <Field label="Amount"><input name="amount" type="number" step="0.01" min="0" defaultValue={income?.amount ?? ""} required /></Field>
      <Field label="Frequency"><select name="frequency" defaultValue={income?.frequency ?? "monthly"}><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="twice_monthly">Twice a month</option><option value="monthly">Monthly</option></select></Field>
      <Field label="Pay date or dates"><input name="pay_dates" placeholder="1st and 15th" defaultValue={income?.pay_dates ?? ""} /></Field>
      <Field label="Income type"><select name="is_fixed" defaultValue={String(income?.is_fixed ?? true)}><option value="true">Fixed</option><option value="false">Variable</option></select></Field>
      <Field label="Reliability"><select name="is_guaranteed" defaultValue={String(income?.is_guaranteed ?? true)}><option value="true">Guaranteed</option><option value="false">Uncertain</option></select></Field>
      <button className="btn-primary md:col-span-2" type="submit">Save Income</button>
    </form>
  );
}

export function ExpenseForm({ expense }: { expense?: Partial<Expense> }) {
  return (
    <form action={saveExpense} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={expense?.id ?? ""} />
      <Field label="Expense name"><input name="name" defaultValue={expense?.name ?? ""} required /></Field>
      <Field label="Amount"><input name="amount" type="number" step="0.01" min="0" defaultValue={expense?.amount ?? ""} required /></Field>
      <Field label="Due day"><input name="due_day" type="number" min="1" max="31" defaultValue={expense?.due_day ?? 1} required /></Field>
      <Field label="Category"><select name="category" defaultValue={expense?.category ?? "Other"}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
      <Field label="Need level"><select name="is_required" defaultValue={String(expense?.is_required ?? true)}><option value="true">Required</option><option value="false">Optional</option></select></Field>
      <button className="btn-primary md:col-span-2" type="submit">Save Expense</button>
    </form>
  );
}

export function EmergencyForm({ settings }: { settings?: Partial<EmergencySettings> | null }) {
  return (
    <form action={saveEmergencySettings} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={settings?.id ?? ""} />
      <Field label="Current emergency savings"><input name="current_savings" type="number" min="0" step="0.01" defaultValue={settings?.current_savings ?? 0} required /></Field>
      <Field label="Savings to keep untouched"><input name="target_savings" type="number" min="0" step="0.01" defaultValue={settings?.target_savings ?? 1000} required /></Field>
      <Field label="Automatic amount"><select name="auto_calculate" defaultValue={String(settings?.auto_calculate ?? true)}><option value="true">Let app choose</option><option value="false">Use my amount or percentage</option></select></Field>
      <Field label="Automatic mode"><select name="mode" defaultValue={settings?.mode ?? "balanced"}><option value="safe">Safe mode</option><option value="balanced">Balanced mode</option><option value="aggressive">Aggressive payoff mode</option></select></Field>
      <Field label="Monthly amount"><input name="monthly_amount" type="number" min="0" step="0.01" defaultValue={settings?.monthly_amount ?? ""} /></Field>
      <Field label="Monthly percentage"><input name="monthly_percentage" type="number" min="0" max="100" step="0.1" defaultValue={settings?.monthly_percentage ?? ""} /></Field>
      <button className="btn-primary md:col-span-2" type="submit">Save Emergency Settings</button>
    </form>
  );
}

export function LoanForm({ loan }: { loan?: Partial<Loan> }) {
  return (
    <form action={saveLoan} className="card grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={loan?.id ?? ""} />
      <Field label="Loan name"><input name="name" defaultValue={loan?.name ?? ""} required /></Field>
      <Field label="Loan type"><select name="loan_type" defaultValue={loan?.loan_type ?? "Credit card"}>{loanTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
      <Field label="Current remaining balance"><input name="current_balance" type="number" min="0" step="0.01" defaultValue={loan?.current_balance ?? ""} required /></Field>
      <Field label="Original principal"><input name="original_principal" type="number" min="0" step="0.01" defaultValue={loan?.original_principal ?? ""} required /></Field>
      <Field label="APR"><input name="apr" type="number" min="0" step="0.01" defaultValue={loan?.apr ?? ""} required /></Field>
      <Field label="Interest type"><select name="interest_type" defaultValue={loan?.interest_type ?? "fixed"}><option value="fixed">Fixed</option><option value="variable">Variable</option></select></Field>
      <Field label="Minimum monthly payment"><input name="minimum_payment" type="number" min="0" step="0.01" defaultValue={loan?.minimum_payment ?? ""} required /></Field>
      <Field label="Payment due day"><input name="due_day" type="number" min="1" max="31" defaultValue={loan?.due_day ?? 1} required /></Field>
      <Field label="Amount already paid"><input name="amount_paid_so_far" type="number" min="0" step="0.01" defaultValue={loan?.amount_paid_so_far ?? 0} /></Field>
      <Field label="Late fee"><input name="late_fee" type="number" min="0" step="0.01" defaultValue={loan?.late_fee ?? 0} /></Field>
      <Field label="Prepayment penalty"><input name="prepayment_penalty" type="number" min="0" step="0.01" defaultValue={loan?.prepayment_penalty ?? 0} /></Field>
      <Field label="Promotional APR ending date"><input name="promo_apr_end_date" type="date" defaultValue={loan?.promo_apr_end_date ?? ""} /></Field>
      <Field label="Notes"><textarea name="notes" defaultValue={loan?.notes ?? ""} /></Field>
      <button className="btn-primary md:col-span-2" type="submit">Save Loan</button>
    </form>
  );
}

export function PaymentForm({ loanId, payment }: { loanId: string; payment?: Partial<Payment> }) {
  return (
    <form action={savePayment} className="card grid gap-4 md:grid-cols-3">
      <input type="hidden" name="id" value={payment?.id ?? ""} />
      <input type="hidden" name="loan_id" value={loanId} />
      <Field label="Payment date"><input name="payment_date" type="date" defaultValue={payment?.payment_date ?? ""} required /></Field>
      <Field label="Amount"><input name="amount" type="number" min="0" step="0.01" defaultValue={payment?.amount ?? ""} required /></Field>
      <Field label="Extra amount"><input name="extra_amount" type="number" min="0" step="0.01" defaultValue={payment?.extra_amount ?? 0} /></Field>
      <Field label="Interest paid"><input name="interest_paid" type="number" min="0" step="0.01" defaultValue={payment?.interest_paid ?? 0} /></Field>
      <Field label="Principal paid"><input name="principal_paid" type="number" min="0" step="0.01" defaultValue={payment?.principal_paid ?? 0} /></Field>
      <button className="btn-primary self-end" type="submit">{payment?.id ? "Update Payment" : "Add Payment"}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1"><label>{label}</label>{children}</div>;
}
