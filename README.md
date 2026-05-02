# Smart Debt Optimizer

Smart Debt Optimizer is a no-login, browser-local financial planning and loan repayment optimizer.

Enter income, expenses, emergency savings preferences, and loans, then the app compares minimum-only, avalanche, snowball, and hybrid payoff strategies. It chooses the projected lowest-interest plan and shows a month-by-month repayment schedule.

Your data is saved in this browser with `localStorage`. No account, database, password, or Supabase project is required.

## Tech Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Browser `localStorage` persistence
- Recharts-ready frontend structure
- Vitest unit tests for repayment calculations

## Local Development

Install Node.js, then run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Tests And Build

```bash
npm test
npm run build
```

## Main Pages

- `/` landing page
- `/dashboard` summary and warnings
- `/setup` first-run finance setup
- `/income`
- `/expenses`
- `/loans`
- `/optimizer`
- `/schedule`
- `/settings`

## Disclaimer

This app provides educational financial calculations and planning estimates. It is not professional financial advice and does not guarantee savings.
