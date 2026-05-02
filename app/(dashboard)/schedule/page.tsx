import { createClient } from "@/lib/supabase/server";
import { loadOptimizerData } from "@/lib/data/optimizer";
import { currency } from "@/lib/format";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { plan } = await loadOptimizerData(user!.id);
  const rows = plan.winner.schedule;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Repayment Schedule</h1>
        <p className="text-slate-600">Month by month allocation of interest, minimum payments, extra payments, savings, and cash buffer.</p>
      </div>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Month</th>
              <th>Date</th>
              <th>Loan</th>
              <th>Starting balance</th>
              <th>Interest</th>
              <th>Minimum</th>
              <th>Extra</th>
              <th>Ending balance</th>
              <th>Emergency savings</th>
              <th>Cash buffer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.monthNumber}-${row.loanId}`} className="border-b last:border-0">
                <td className="py-3">{row.monthNumber}</td>
                <td>{row.monthDate}</td>
                <td>{row.loanName}</td>
                <td>{currency(row.startingBalance)}</td>
                <td>{currency(row.interestCharged)}</td>
                <td>{currency(row.minimumPayment)}</td>
                <td>{currency(row.extraPayment)}</td>
                <td>{currency(row.endingBalance)}</td>
                <td>{currency(row.emergencySavingsContribution)}</td>
                <td>{currency(row.remainingCashBuffer)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="py-6 text-center text-sm text-slate-500">No schedule yet. Add income and loans, then open optimizer results.</p> : null}
      </section>
    </div>
  );
}
