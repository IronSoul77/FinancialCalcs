create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0 check (amount >= 0),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'twice_monthly', 'monthly')),
  pay_dates text,
  is_fixed boolean not null default true,
  is_guaranteed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0 check (amount >= 0),
  category text not null default 'Other',
  due_day integer not null check (due_day between 1 and 31),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  current_savings numeric not null default 0 check (current_savings >= 0),
  target_savings numeric not null default 0 check (target_savings >= 0),
  mode text not null default 'balanced' check (mode in ('safe', 'balanced', 'aggressive')),
  monthly_amount numeric check (monthly_amount is null or monthly_amount >= 0),
  monthly_percentage numeric check (monthly_percentage is null or monthly_percentage between 0 and 100),
  auto_calculate boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  loan_type text not null,
  current_balance numeric not null default 0 check (current_balance >= 0),
  original_principal numeric not null default 0 check (original_principal >= 0),
  apr numeric not null default 0 check (apr >= 0),
  interest_type text not null default 'fixed' check (interest_type in ('fixed', 'variable')),
  minimum_payment numeric not null default 0 check (minimum_payment >= 0),
  due_day integer not null check (due_day between 1 and 31),
  amount_paid_so_far numeric not null default 0 check (amount_paid_so_far >= 0),
  late_fee numeric check (late_fee is null or late_fee >= 0),
  prepayment_penalty numeric check (prepayment_penalty is null or prepayment_penalty >= 0),
  promo_apr_end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  payment_date date not null,
  amount numeric not null default 0 check (amount >= 0),
  extra_amount numeric not null default 0 check (extra_amount >= 0),
  interest_paid numeric not null default 0 check (interest_paid >= 0),
  principal_paid numeric not null default 0 check (principal_paid >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.repayment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_name text not null check (strategy_name in ('minimum', 'avalanche', 'snowball', 'hybrid')),
  monthly_income numeric not null default 0,
  monthly_expenses numeric not null default 0,
  monthly_emergency_savings numeric not null default 0,
  monthly_minimum_payments numeric not null default 0,
  monthly_extra_payment numeric not null default 0,
  total_interest_paid numeric not null default 0,
  interest_saved_vs_minimum numeric not null default 0,
  debt_free_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.repayment_plan_months (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.repayment_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_number integer not null,
  month_date date not null,
  loan_id uuid not null references public.loans(id) on delete cascade,
  starting_balance numeric not null default 0,
  interest_charged numeric not null default 0,
  minimum_payment numeric not null default 0,
  extra_payment numeric not null default 0,
  ending_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists income_sources_user_id_idx on public.income_sources(user_id);
create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists loans_user_id_idx on public.loans(user_id);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists repayment_plans_user_id_idx on public.repayment_plans(user_id);
create index if not exists repayment_plan_months_user_id_idx on public.repayment_plan_months(user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists income_sources_set_updated_at on public.income_sources;
create trigger income_sources_set_updated_at before update on public.income_sources for each row execute function public.set_updated_at();
drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists emergency_settings_set_updated_at on public.emergency_settings;
create trigger emergency_settings_set_updated_at before update on public.emergency_settings for each row execute function public.set_updated_at();
drop trigger if exists loans_set_updated_at on public.loans;
create trigger loans_set_updated_at before update on public.loans for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.income_sources enable row level security;
alter table public.expenses enable row level security;
alter table public.emergency_settings enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;
alter table public.repayment_plans enable row level security;
alter table public.repayment_plan_months enable row level security;

create policy "Users can select own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Users can delete own profile" on public.profiles for delete using (id = auth.uid());

create policy "Users can select own income" on public.income_sources for select using (user_id = auth.uid());
create policy "Users can insert own income" on public.income_sources for insert with check (user_id = auth.uid());
create policy "Users can update own income" on public.income_sources for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own income" on public.income_sources for delete using (user_id = auth.uid());

create policy "Users can select own expenses" on public.expenses for select using (user_id = auth.uid());
create policy "Users can insert own expenses" on public.expenses for insert with check (user_id = auth.uid());
create policy "Users can update own expenses" on public.expenses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own expenses" on public.expenses for delete using (user_id = auth.uid());

create policy "Users can select own emergency settings" on public.emergency_settings for select using (user_id = auth.uid());
create policy "Users can insert own emergency settings" on public.emergency_settings for insert with check (user_id = auth.uid());
create policy "Users can update own emergency settings" on public.emergency_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own emergency settings" on public.emergency_settings for delete using (user_id = auth.uid());

create policy "Users can select own loans" on public.loans for select using (user_id = auth.uid());
create policy "Users can insert own loans" on public.loans for insert with check (user_id = auth.uid());
create policy "Users can update own loans" on public.loans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own loans" on public.loans for delete using (user_id = auth.uid());

create policy "Users can select own payments" on public.payments for select using (user_id = auth.uid());
create policy "Users can insert own payments" on public.payments for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.loans where loans.id = payments.loan_id and loans.user_id = auth.uid())
);
create policy "Users can update own payments" on public.payments for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.loans where loans.id = payments.loan_id and loans.user_id = auth.uid())
);
create policy "Users can delete own payments" on public.payments for delete using (user_id = auth.uid());

create policy "Users can select own repayment plans" on public.repayment_plans for select using (user_id = auth.uid());
create policy "Users can insert own repayment plans" on public.repayment_plans for insert with check (user_id = auth.uid());
create policy "Users can update own repayment plans" on public.repayment_plans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own repayment plans" on public.repayment_plans for delete using (user_id = auth.uid());

create policy "Users can select own repayment plan months" on public.repayment_plan_months for select using (user_id = auth.uid());
create policy "Users can insert own repayment plan months" on public.repayment_plan_months for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.repayment_plans where repayment_plans.id = repayment_plan_months.plan_id and repayment_plans.user_id = auth.uid())
  and exists (select 1 from public.loans where loans.id = repayment_plan_months.loan_id and loans.user_id = auth.uid())
);
create policy "Users can update own repayment plan months" on public.repayment_plan_months for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.repayment_plans where repayment_plans.id = repayment_plan_months.plan_id and repayment_plans.user_id = auth.uid())
  and exists (select 1 from public.loans where loans.id = repayment_plan_months.loan_id and loans.user_id = auth.uid())
);
create policy "Users can delete own repayment plan months" on public.repayment_plan_months for delete using (user_id = auth.uid());
