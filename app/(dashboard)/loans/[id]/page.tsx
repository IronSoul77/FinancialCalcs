import { notFound } from "next/navigation";
import { deletePayment } from "@/app/actions/data";
import { LoanForm, PaymentForm } from "@/components/Forms";
import { createClient } from "@/lib/supabase/server";
import { chooseBestPlan } from "@/lib/optimizer/engine";
import { currency, percent } from "@/lib/format";
import type { OptimizerInput } from "@/lib/optimizer/types";
import type { EmergencySettings, Expense, IncomeSource, Loan, Payment } from "@/lib/types/database";

export default async function LoanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [loanResult, income, expenses, emergency, loans, payments] = await Promise.all([
    supabase.from("loans").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle(),
    supabase.from("income_sources").select("*").eq("user_id", user!.id),
    supabase.from("expenses").select("*").eq("user_id", user!.id),
    supabase.from("emergency_settings").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("loans").select("*").eq("user_id", user!.id),
    supabase.from("payments").select("*").eq("loan_id", id).eq("user_id", user!.id).order("payment_date", { ascending: false })
  ]);
  const loan = loanResult.data as Loan | null;
  if (!loan) notFound();

  const paymentRows = (payments.data ?? []) as Payment[];
  const input: OptimizerInput = {
    incomeSources: (income.data ?? []) as IncomeSource[],
    expenses: (expenses.data ?? []) as Expense[],
    emergencyRule: emergency.data as EmergencySettings | null,
    loans: (loans.data ?? []) as Loan[]
  };
  const { winner } = chooseBestPlan(input);
  const row = winner.schedule.find((item) => item.loanId === loan.id);
  const monthlyInterest = loan.current_balance * (loan.apr / 100 / 12);
  const principal = loan.minimum_payment - monthlyInterest;
  const recommendedExtra = row?.extraPayment ?? 0;
  const payoffMonth = winner.schedule.filter((item) => item.loanId === loan.id).at(-1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{loan.name}</h1>
        <p className="text-slate-600">{loan.loan_type} details and payment insight.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current balance" value={currency(loan.current_balance)} />
        <Metric label="APR" value={percent(loan.apr)} />
        <Metric label="Minimum payment" value={currency(loan.minimum_payment)} />
        <Metric label="Monthly interest estimate" value={currency(monthlyInterest)} />
        <Metric label="Payment to interest" value={currency(Math.min(loan.minimum_payment, monthlyInterest))} />
        <Metric label="Payment to principal" value={currency(Math.max(0, principal))} />
        <Metric label="Recommended extra payment" value={currency(recommendedExtra)} />
        <Metric label="Projected payoff" value={payoffMonth?.monthDate ?? "Not reached"} />
      </section>
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
        Your monthly payment is {currency(loan.minimum_payment)}. Estimated monthly interest is {currency(monthlyInterest)}. About {currency(Math.max(0, principal))} is reducing the balance.
        {loan.apr >= 24 ? " This loan should be prioritized because it has a high APR." : " The optimizer compares this against your other debts before assigning extra payments."}
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Edit Loan</h2>
        <LoanForm loan={loan} />
      </section>
      <PaymentForm loanId={loan.id} />
      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-lg font-semibold">Payment History</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Date</th><th>Amount</th><th>Extra</th><th>Interest</th><th>Principal</th><th /></tr></thead>
          <tbody>{paymentRows.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="py-3">{payment.payment_date}</td><td>{currency(payment.amount)}</td><td>{currency(payment.extra_amount)}</td><td>{currency(payment.interest_paid)}</td><td>{currency(payment.principal_paid)}</td><td><form action={deletePayment}><input type="hidden" name="id" value={payment.id} /><button className="btn-secondary py-1" type="submit">Delete</button></form></td></tr>)}</tbody>
        </table>
        {!paymentRows.length ? <p className="py-6 text-center text-sm text-slate-500">No payments logged for this loan yet.</p> : null}
      </section>
      {paymentRows.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Payments</h2>
          {paymentRows.map((payment) => <PaymentForm key={payment.id} loanId={loan.id} payment={payment} />)}
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="card"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
