"use client";

import type { ReactElement } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { SimulationResult } from "@/lib/optimizer/types";

type Props = {
  result: SimulationResult;
  cashFlow: Array<{ name: string; amount: number }>;
};

function byMonth(result: SimulationResult) {
  const grouped = new Map<number, { month: number; balance: number; interest: number }>();
  for (const row of result.schedule) {
    const existing = grouped.get(row.monthNumber) ?? { month: row.monthNumber, balance: 0, interest: 0 };
    existing.balance += row.endingBalance;
    existing.interest += row.interestCharged;
    grouped.set(row.monthNumber, existing);
  }
  let cumulativeInterest = 0;
  return [...grouped.values()].map((row) => {
    cumulativeInterest += row.interest;
    return {
      month: `M${row.month}`,
      balance: Math.round(row.balance),
      interest: Math.round(cumulativeInterest)
    };
  });
}

export function OptimizerCharts({ result, cashFlow }: Props) {
  const data = byMonth(result);
  const payoff = result.payoffOrder.map((name, index) => ({ name, order: index + 1 }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartShell title="Debt Balance Over Time">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" minTickGap={24} />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="balance" stroke="#0f766e" fill="#99f6e4" />
        </AreaChart>
      </ChartShell>
      <ChartShell title="Interest Paid Over Time">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" minTickGap={24} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="interest" stroke="#b91c1c" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartShell>
      <ChartShell title="Monthly Cash Flow">
        <BarChart data={cashFlow}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#2563eb" />
        </BarChart>
      </ChartShell>
      <ChartShell title="Loan Payoff Order">
        <BarChart data={payoff}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} reversed />
          <Tooltip />
          <Bar dataKey="order" fill="#16a34a" />
        </BarChart>
      </ChartShell>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: ReactElement }) {
  return (
    <section className="card">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
