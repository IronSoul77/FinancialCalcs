import { Trash2 } from "lucide-react";
import { deleteIncome } from "@/app/actions/data";
import { IncomeForm } from "@/components/Forms";
import { createClient } from "@/lib/supabase/server";
import { currency } from "@/lib/format";
import type { IncomeSource } from "@/lib/types/database";

export default async function IncomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("income_sources").select("*").eq("user_id", user!.id).order("created_at");
  const rows = (data ?? []) as IncomeSource[];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Income</h1>
      <IncomeForm />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Name</th><th>Amount</th><th>Frequency</th><th>Pay dates</th><th /></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="py-3">{row.name}</td><td>{currency(row.amount)}</td><td>{row.frequency}</td><td>{row.pay_dates}</td><td><form action={deleteIncome}><input type="hidden" name="id" value={row.id} /><button className="rounded-md p-2 hover:bg-slate-100" aria-label="Delete income"><Trash2 size={16} /></button></form></td></tr>)}</tbody>
        </table>
        {!rows.length ? <p className="py-6 text-center text-sm text-slate-500">No income records yet.</p> : null}
      </div>
      {rows.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Income Records</h2>
          {rows.map((row) => <IncomeForm key={row.id} income={row} />)}
        </section>
      ) : null}
    </div>
  );
}
