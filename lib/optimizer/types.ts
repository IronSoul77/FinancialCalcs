import type { EmergencyMode, InterestType, StrategyName } from "@/lib/types/database";

export type OptimizerIncome = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  is_guaranteed: boolean;
};

export type OptimizerExpense = {
  id: string;
  name: string;
  amount: number;
  is_required: boolean;
};

export type OptimizerLoan = {
  id: string;
  name: string;
  current_balance: number;
  apr: number;
  interest_type: InterestType;
  minimum_payment: number;
  late_fee?: number | null;
  prepayment_penalty?: number | null;
  promo_apr_end_date?: string | null;
};

export type EmergencyRule = {
  current_savings: number;
  target_savings: number;
  mode: EmergencyMode;
  monthly_amount?: number | null;
  monthly_percentage?: number | null;
  auto_calculate: boolean;
};

export type MonthLoanRow = {
  monthNumber: number;
  monthDate: string;
  loanId: string;
  loanName: string;
  startingBalance: number;
  interestCharged: number;
  minimumPayment: number;
  extraPayment: number;
  endingBalance: number;
  emergencySavingsContribution: number;
  remainingCashBuffer: number;
};

export type SimulationResult = {
  strategyName: StrategyName;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmergencySavings: number;
  monthlyMinimumPayments: number;
  monthlyExtraPayment: number;
  totalInterestPaid: number;
  debtFreeDate: string | null;
  totalMonths: number;
  schedule: MonthLoanRow[];
  payoffOrder: string[];
  warnings: string[];
};

export type OptimizerInput = {
  incomeSources: OptimizerIncome[];
  expenses: OptimizerExpense[];
  emergencyRule: EmergencyRule | null;
  loans: OptimizerLoan[];
  startDate?: Date;
};
