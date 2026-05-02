import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteLoan } from "@/app/actions/data";
import { LoanForm } from "@/components/Forms";
import { createClient } from "@/lib/supabase/server";
import { currency, percent } from "@/lib/format";
import type { Loan } from "@/lib/types/database";

export default async function LoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("loans").select("*").eq("user_id", user!.id).order("apr", { ascending: false });
  const rows = (data ?? []) as Loan[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loans</h1>
        <p className="text-slate-600">Add every debt so the optimizer can compare avalanche, snowball, and hybrid plans.</p>
      </div>
      <LoanForm />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Loan</th>
              <th>Type</th>
              <th>Balance</th>
              <th>APR</th>
              <th>Minimum</th>
              <th>Due</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((loan) => (
              <tr key={loan.id} className="border-b last:border-0">
                <td className="py-3"><Link href={`/loans/${loan.id}`} className="font-semibold text-teal-800 hover:underline">{loan.name}</Link></td>
                <td>{loan.loan_type}</td>
                <td>{currency(loan.current_balance)}</td>
                <td>{percent(loan.apr)}</td>
                <td>{currency(loan.minimum_payment)}</td>
                <td>{loan.due_day}</td>
                <td>
                  <form action={deleteLoan}>
                    <input type="hidden" name="id" value={loan.id} />
                    <button className="rounded-md p-2 hover:bg-slate-100" aria-label="Delete loan" type="submit"><Trash2 size={16} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="py-6 text-center text-sm text-slate-500">No loans yet. Add one above to unlock the optimizer.</p> : null}
      </div>
    </div>
  );
}
