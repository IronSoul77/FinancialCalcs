import { describe, expect, it } from "vitest";
import { chooseBestPlan, monthlyIncome, simulateStrategy } from "../lib/optimizer/engine";
import type { OptimizerInput } from "../lib/optimizer/types";

const input: OptimizerInput = {
  startDate: new Date("2026-01-01"),
  incomeSources: [{ id: "income", name: "Salary", amount: 5000, frequency: "monthly", is_guaranteed: true }],
  expenses: [{ id: "rent", name: "Rent", amount: 2200, is_required: true }],
  emergencyRule: { current_savings: 1000, target_savings: 1000, mode: "balanced", auto_calculate: true },
  loans: [
    { id: "card", name: "Credit Card", current_balance: 6000, apr: 27, interest_type: "fixed", minimum_payment: 180 },
    { id: "car", name: "Car", current_balance: 12000, apr: 7, interest_type: "fixed", minimum_payment: 350 }
  ]
};

describe("optimizer engine", () => {
  it("normalizes income frequencies to monthly income", () => {
    expect(monthlyIncome({
      ...input,
      incomeSources: [{ id: "weekly", name: "Weekly", amount: 1000, frequency: "weekly", is_guaranteed: true }]
    })).toBe(4333.33);
  });

  it("avalanche attacks the highest APR loan first", () => {
    const result = simulateStrategy(input, "avalanche");
    const firstExtra = result.schedule.find((row) => row.extraPayment > 0);
    expect(firstExtra?.loanName).toBe("Credit Card");
  });

  it("chooses the lowest interest strategy and reports savings against minimum payments", () => {
    const result = chooseBestPlan(input);
    const minimum = result.results.find((strategy) => strategy.strategyName === "minimum");
    expect(result.winner.strategyName).not.toBe("minimum");
    expect(result.winner.totalInterestPaid).toBeLessThanOrEqual(minimum!.totalInterestPaid);
    expect(result.interestSavedVsMinimum).toBeGreaterThan(0);
  });
});
