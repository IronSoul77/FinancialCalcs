import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/actions/data";
import { ExpenseForm } from "@/components/Forms";
import { createClient } from "@/lib/supabase/server";
import { currency } from "@/lib/format";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase.from("expenses").select("*").eq("user_id", user!.id).order("due_day");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Expenses</h1>
      <ExpenseForm />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-2">Name</th><th>Amount</th><th>Category</th><th>Due</th><th>Type</th><th /></tr></thead>
          <tbody>{data?.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="py-3">{row.name}</td><td>{currency(row.amount)}</td><td>{row.category}</td><td>{row.due_day}</td><td>{row.is_required ? "Required" : "Optional"}</td><td><form action={deleteExpense}><input type="hidden" name="id" value={row.id} /><button className="rounded-md p-2 hover:bg-slate-100" aria-label="Delete expense"><Trash2 size={16} /></button></form></td></tr>)}</tbody>
        </table>
        {!data?.length ? <p className="py-6 text-center text-sm text-slate-500">No expenses yet.</p> : null}
      </div>
      {data?.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Expenses</h2>
          {data.map((row) => <ExpenseForm key={row.id} expense={row} />)}
        </section>
      ) : null}
    </div>
  );
}
