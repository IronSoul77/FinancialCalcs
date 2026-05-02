import Link from "next/link";
import { logOut } from "@/app/actions/auth";

const links = [
  ["Dashboard", "/dashboard"],
  ["Setup", "/setup"],
  ["Income", "/income"],
  ["Expenses", "/expenses"],
  ["Loans", "/loans"],
  ["Optimizer", "/optimizer"],
  ["Schedule", "/schedule"],
  ["Settings", "/settings"]
];

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-teal-800">Smart Debt Optimizer</Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">{label}</Link>
          ))}
          <form action={logOut}>
            <button className="btn-secondary py-2" type="submit">Logout</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
