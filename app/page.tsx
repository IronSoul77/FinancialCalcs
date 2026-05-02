import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Salary based debt planning</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">Smart Debt Optimizer</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Understand monthly cash flow, protect emergency savings, and pay off loans in the most efficient order to reduce wasted interest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary">Start Planning</Link>
            <Link href="/setup" className="btn-secondary">Enter My Numbers</Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Educational planning estimates only. This is not professional financial advice and savings are not guaranteed.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
          <div className="grid gap-4">
            {["No account required", "Cash flow after required expenses", "Emergency savings guardrails", "Month by month repayment schedule"].map((item) => (
              <div key={item} className="rounded-md bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{item}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 w-2/3 rounded-full bg-teal-700" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
