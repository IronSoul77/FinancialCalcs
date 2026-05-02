# Smart Debt Optimizer
Vibe coded all this shi
this is AI Generated OFC
Smart Debt Optimizer is a salary based financial planning and loan repayment app. It helps a signed-in user enter income, required and optional expenses, emergency savings rules, loans, and payments, then generates a deterministic month by month repayment strategy.

The app compares minimum payments only, debt avalanche, debt snowball, and an optimized hybrid strategy. It chooses the projected lowest-interest plan while respecting expenses, emergency savings, minimum payments, prepayment penalties, promotional deadlines, late fee risk, and variable interest risk.

This app provides educational financial calculations and planning estimates. It is not professional financial advice and does not guarantee savings.

## Tech Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Next.js server actions
- Supabase Auth
- Supabase Postgres with Row Level Security
- Recharts
- Vitest

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-if-you-add-admin-jobs
```

Only use `SUPABASE_SERVICE_ROLE_KEY` on the server. Do not expose it in client components or variables prefixed with `NEXT_PUBLIC_`.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/migrations/001_initial_schema.sql`.
4. Confirm RLS is enabled on:
   - `profiles`
   - `income_sources`
   - `expenses`
   - `emergency_settings`
   - `loans`
   - `payments`
   - `repayment_plans`
   - `repayment_plan_months`
5. In Authentication settings, configure your site URL and redirect URLs for local development, for example `http://localhost:3000`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

The repayment engine lives in `lib/optimizer/engine.ts` so calculations can be tested independently from the UI.

## Main Pages

- `/` landing page
- `/signup` and `/login`
- `/setup` first-run finance setup
- `/dashboard` financial summary and warnings
- `/income`
- `/expenses`
- `/loans`
- `/loans/[id]`
- `/optimizer`
- `/schedule`
- `/settings`

## Data Persistence And Security

User records are persisted in Supabase Postgres and tied to `auth.users.id`. Passwords are handled by Supabase Auth and are never stored by this application.

Every user-owned table has Row Level Security policies that allow users to select, insert, update, and delete only their own rows. `profiles.id` is the authenticated user's id, and every other table uses `user_id = auth.uid()`.

## Push To GitHub

```bash
git init
git add .
git commit -m "Build Smart Debt Optimizer"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```
