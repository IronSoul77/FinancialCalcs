import { addMonths, formatISO } from "date-fns";
import type { MonthLoanRow, OptimizerInput, OptimizerLoan, SimulationResult } from "./types";
import type { StrategyName } from "@/lib/types/database";

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function monthlyIncome(input: OptimizerInput) {
  return roundMoney(
    input.incomeSources.reduce((sum, source) => {
      if (source.frequency === "weekly") return sum + source.amount * 52 / 12;
      if (source.frequency === "biweekly") return sum + source.amount * 26 / 12;
      if (source.frequency === "twice_monthly") return sum + source.amount * 2;
      return sum + source.amount;
    }, 0)
  );
}

export function emergencyContribution(income: number, requiredExpenses: number, rule: OptimizerInput["emergencyRule"]) {
  if (!rule) return 0;
  if (!rule.auto_calculate) {
    if (rule.monthly_amount) return roundMoney(rule.monthly_amount);
    if (rule.monthly_percentage) return roundMoney(income * (rule.monthly_percentage / 100));
    return 0;
  }

  if (rule.current_savings >= rule.target_savings) return 0;
  const gap = Math.max(0, rule.target_savings - rule.current_savings);
  const base = Math.max(0, income - requiredExpenses);
  const rate = rule.mode === "safe" ? 0.18 : rule.mode === "balanced" ? 0.1 : 0.05;
  return roundMoney(Math.min(gap, base * rate));
}

function loanPriority(loan: OptimizerLoan, strategy: StrategyName, monthDate: Date) {
  if (strategy === "snowball") return -loan.current_balance;
  if (strategy === "minimum") return -Number.MAX_SAFE_INTEGER;
  if (strategy === "hybrid") {
    const promoRisk = loan.promo_apr_end_date
      ? Math.max(0, 12 - Math.ceil((new Date(loan.promo_apr_end_date).getTime() - monthDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 0;
    const lateRisk = loan.late_fee ? Math.min(8, loan.late_fee / 25) : 0;
    const variableRisk = loan.interest_type === "variable" ? 4 : 0;
    const penalty = loan.prepayment_penalty ? Math.min(12, loan.prepayment_penalty / 50) : 0;
    return loan.apr * 2 + promoRisk + lateRisk + variableRisk - penalty;
  }
  return loan.apr - (loan.prepayment_penalty ? Math.min(3, loan.prepayment_penalty / 1000) : 0);
}

function chooseTarget(loans: OptimizerLoan[], strategy: StrategyName, monthDate: Date) {
  const active = loans.filter((loan) => loan.current_balance > 0.005);
  if (!active.length) return null;
  return [...active].sort((a, b) => loanPriority(b, strategy, monthDate) - loanPriority(a, strategy, monthDate))[0];
}

export function simulateStrategy(input: OptimizerInput, strategyName: StrategyName): SimulationResult {
  const startDate = input.startDate ?? new Date();
  const income = monthlyIncome(input);
  const requiredExpenses = input.expenses.filter((expense) => expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const optionalExpenses = input.expenses.filter((expense) => !expense.is_required).reduce((sum, expense) => sum + expense.amount, 0);
  const expenses = roundMoney(requiredExpenses + optionalExpenses);
  const emergency = emergencyContribution(income, requiredExpenses, input.emergencyRule);
  const loans = input.loans.map((loan) => ({ ...loan }));
  const minimums = roundMoney(loans.reduce((sum, loan) => sum + Math.min(loan.current_balance, loan.minimum_payment), 0));
  const extraAvailable = roundMoney(Math.max(0, income - expenses - emergency - minimums));
  const warnings: string[] = [];

  if (income < expenses + minimums) warnings.push("Income is less than expenses plus minimum loan payments. This plan is not affordable yet.");
  if (!input.emergencyRule || input.emergencyRule.current_savings <= 0) warnings.push("Emergency savings is zero. Avoid sending every extra dollar to loans until a starter buffer exists.");
  loans.forEach((loan) => {
    const interest = loan.current_balance * (loan.apr / 100 / 12);
    if (loan.minimum_payment < interest) warnings.push(`${loan.name} minimum payment does not cover monthly interest, so the balance may grow.`);
    if (loan.apr >= 24) warnings.push(`${loan.name} has a very high APR and should be treated as urgent.`);
  });

  const schedule: MonthLoanRow[] = [];
  const payoffOrder: string[] = [];
  let totalInterestPaid = 0;
  let monthNumber = 0;
  const maxMonths = 600;

  while (loans.some((loan) => loan.current_balance > 0.005) && monthNumber < maxMonths) {
    monthNumber += 1;
    const monthDate = addMonths(startDate, monthNumber - 1);
    const activeMinimumBudget = roundMoney(loans.reduce((sum, loan) => {
      if (loan.current_balance <= 0.005) return sum;
      const interest = loan.current_balance * (loan.apr / 100 / 12);
      return sum + Math.min(loan.current_balance + interest, loan.minimum_payment);
    }, 0));
    const monthExtraAvailable = roundMoney(Math.max(0, income - expenses - emergency - activeMinimumBudget));
    let extraPool = strategyName === "minimum" ? 0 : monthExtraAvailable;
    let usedExtra = 0;
    const target = chooseTarget(loans, strategyName, monthDate);

    for (const loan of loans) {
      if (loan.current_balance <= 0.005) continue;
      const startingBalance = loan.current_balance;
      const interestCharged = roundMoney(startingBalance * (loan.apr / 100 / 12));
      const minimumPayment = roundMoney(Math.min(startingBalance + interestCharged, loan.minimum_payment));
      let extraPayment = 0;
      if (target?.id === loan.id && extraPool > 0) {
        extraPayment = roundMoney(Math.min(extraPool, Math.max(0, startingBalance + interestCharged - minimumPayment)));
        extraPool = roundMoney(extraPool - extraPayment);
        usedExtra = roundMoney(usedExtra + extraPayment);
      }
      const totalPayment = minimumPayment + extraPayment;
      const endingBalance = roundMoney(Math.max(0, startingBalance + interestCharged - totalPayment));
      totalInterestPaid = roundMoney(totalInterestPaid + interestCharged);
      loan.current_balance = endingBalance;
      schedule.push({
        monthNumber,
        monthDate: formatISO(monthDate, { representation: "date" }),
        loanId: loan.id,
        loanName: loan.name,
        startingBalance: roundMoney(startingBalance),
        interestCharged,
        minimumPayment,
        extraPayment,
        endingBalance,
        emergencySavingsContribution: emergency,
        remainingCashBuffer: roundMoney(monthExtraAvailable - usedExtra)
      });
      if (endingBalance <= 0.005 && !payoffOrder.includes(loan.name)) payoffOrder.push(loan.name);
    }
  }

  return {
    strategyName,
    monthlyIncome: income,
    monthlyExpenses: expenses,
    monthlyEmergencySavings: emergency,
    monthlyMinimumPayments: minimums,
    monthlyExtraPayment: extraAvailable,
    totalInterestPaid,
    debtFreeDate: monthNumber < maxMonths ? formatISO(addMonths(startDate, Math.max(0, monthNumber - 1)), { representation: "date" }) : null,
    totalMonths: monthNumber,
    schedule,
    payoffOrder,
    warnings
  };
}

export function chooseBestPlan(input: OptimizerInput) {
  const results = (["minimum", "avalanche", "snowball", "hybrid"] as StrategyName[]).map((strategy) => simulateStrategy(input, strategy));
  const minimum = results.find((result) => result.strategyName === "minimum")!;
  const winner = results
    .filter((result) => result.strategyName !== "minimum")
    .sort((a, b) => a.totalInterestPaid - b.totalInterestPaid || a.totalMonths - b.totalMonths)[0] ?? minimum;
  return {
    winner,
    results,
    interestSavedVsMinimum: roundMoney(Math.max(0, minimum.totalInterestPaid - winner.totalInterestPaid))
  };
}

export function runMonteCarlo(input: OptimizerInput, runs = 500) {
  const base = chooseBestPlan(input).winner;
  const outcomes = Array.from({ length: runs }, (_, index) => {
    const shock = (Math.sin(index * 9301 + 49297) + 1) / 2;
    const incomeDrop = shock > 0.82 ? 0.75 : shock > 0.62 ? 0.9 : 1;
    const expenseJump = shock < 0.18 ? 1.22 : shock < 0.36 ? 1.1 : 1;
    const noExtra = shock > 0.9;
    const stressed: OptimizerInput = {
      ...input,
      incomeSources: input.incomeSources.map((source) => ({ ...source, amount: source.amount * incomeDrop })),
      expenses: input.expenses.map((expense) => ({ ...expense, amount: expense.amount * expenseJump })),
      loans: input.loans.map((loan) => ({ ...loan, apr: loan.interest_type === "variable" ? loan.apr + shock * 2.5 : loan.apr })),
      emergencyRule: input.emergencyRule
    };
    const result = chooseBestPlan(stressed).winner;
    return noExtra ? { ...result, totalMonths: result.totalMonths + 1, totalInterestPaid: result.totalInterestPaid * 1.01 } : result;
  });
  const months = outcomes.map((outcome) => outcome.totalMonths).sort((a, b) => a - b);
  const interests = outcomes.map((outcome) => outcome.totalInterestPaid).sort((a, b) => a - b);
  const onPlan = outcomes.filter((outcome) => outcome.totalMonths <= Math.ceil(base.totalMonths * 1.1)).length / runs;
  return {
    probabilityOnPlan: Math.round(onPlan * 100),
    bestCaseMonths: months[0] ?? 0,
    expectedMonths: Math.round(months.reduce((sum, value) => sum + value, 0) / runs),
    worstCaseMonths: months[months.length - 1] ?? 0,
    interestRange: [roundMoney(interests[0] ?? 0), roundMoney(interests[interests.length - 1] ?? 0)] as const,
    riskLevel: onPlan >= 0.8 ? "low" : onPlan >= 0.6 ? "medium" : "high"
  };
}
