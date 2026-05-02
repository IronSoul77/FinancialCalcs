export function StatCard({ title, value, tone = "default", help }: { title: string; value: string; tone?: "default" | "safe" | "warning" | "urgent" | "paid"; help?: string }) {
  const tones = {
    default: "border-slate-200",
    safe: "border-teal-200 bg-teal-50",
    warning: "border-amber-200 bg-amber-50",
    urgent: "border-red-200 bg-red-50",
    paid: "border-green-200 bg-green-50"
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {help ? <p className="mt-1 text-xs text-slate-600">{help}</p> : null}
    </div>
  );
}
