export type Frequency = "weekly" | "biweekly" | "twice_monthly" | "monthly";
export type EmergencyMode = "safe" | "balanced" | "aggressive";
export type InterestType = "fixed" | "variable";
export type StrategyName = "minimum" | "avalanche" | "snowball" | "hybrid";

export type Profile = {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type IncomeSource = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  pay_dates: string | null;
  is_fixed: boolean;
  is_guaranteed: boolean;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  due_day: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
};

export type EmergencySettings = {
  id: string;
  user_id: string;
  current_savings: number;
  target_savings: number;
  mode: EmergencyMode;
  monthly_amount: number | null;
  monthly_percentage: number | null;
  auto_calculate: boolean;
  created_at: string;
  updated_at: string;
};

export type Loan = {
  id: string;
  user_id: string;
  name: string;
  loan_type: string;
  current_balance: number;
  original_principal: number;
  apr: number;
  interest_type: InterestType;
  minimum_payment: number;
  due_day: number;
  amount_paid_so_far: number;
  late_fee: number | null;
  prepayment_penalty: number | null;
  promo_apr_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  loan_id: string;
  payment_date: string;
  amount: number;
  extra_amount: number;
  interest_paid: number;
  principal_paid: number;
  created_at: string;
};

export type RepaymentPlan = {
  id: string;
  user_id: string;
  strategy_name: StrategyName;
  monthly_income: number;
  monthly_expenses: number;
  monthly_emergency_savings: number;
  monthly_minimum_payments: number;
  monthly_extra_payment: number;
  total_interest_paid: number;
  interest_saved_vs_minimum: number;
  debt_free_date: string | null;
  created_at: string;
};

export type RepaymentPlanMonth = {
  id: string;
  plan_id: string;
  user_id: string;
  month_number: number;
  month_date: string;
  loan_id: string;
  starting_balance: number;
  interest_charged: number;
  minimum_payment: number;
  extra_payment: number;
  ending_balance: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      income_sources: { Row: IncomeSource; Insert: Partial<IncomeSource>; Update: Partial<IncomeSource> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      emergency_settings: { Row: EmergencySettings; Insert: Partial<EmergencySettings>; Update: Partial<EmergencySettings> };
      loans: { Row: Loan; Insert: Partial<Loan>; Update: Partial<Loan> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      repayment_plans: { Row: RepaymentPlan; Insert: Partial<RepaymentPlan>; Update: Partial<RepaymentPlan> };
      repayment_plan_months: { Row: RepaymentPlanMonth; Insert: Partial<RepaymentPlanMonth>; Update: Partial<RepaymentPlanMonth> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
