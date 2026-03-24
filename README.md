# Kindergarten Management System (Smart DMTT)

District-level MVP for Uzbekistan state kindergartens to manage paid clubs, parent enrollment/payment, and corporate card expense monitoring.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (credentials)
- Zod validation
- Recharts dashboards
- Vitest tests

## Features (MVP)
- **Auth + RBAC**: `district_admin`, `kindergarten_director`, `staff`, `parent`
- **Organization**: district, kindergartens, users, roles
- **Clubs**: create/view paid clubs and services
- **Parents/Children/Enrollment**: parent sees children, enrolls to clubs
- **Invoices/Payments**:
  - monthly invoice generation (`/api/invoices/generate`)
  - one invoice per enrollment per month
  - mock payment providers: Click/Payme
- **Expense monitoring**:
  - CSV upload for card transactions
  - local file save with sanitized name (`uploads/`)
  - suspicious rule engine + reason tagging
- **Dashboards**:
  - district admin summary + charts
  - director summary scoped to own kindergarten
  - parent summary
- **Audit logs** for key actions:
  - club create
  - invoice paid
  - CSV imported
  - suspicious transaction flagged

## Setup
1. Install dependencies:
```bash
npm install
```
2. Copy env:
```bash
cp .env.example .env
```
3. Ensure PostgreSQL is running and `DATABASE_URL` is correct.
4. Run database and seed:
```bash
npm run setup
```
5. Start app:
```bash
npm run dev
```

Open http://localhost:3000

## One-command run (after setup)
```bash
npm run dev
```

## Prisma commands
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Test
```bash
npm test
```

## Sample users (all password: `Password123!`)
- `admin@dmtt.uz` (district admin)
- `director1@dmtt.uz`, `director2@dmtt.uz`, `director3@dmtt.uz`
- `staff1@dmtt.uz`, `staff2@dmtt.uz`
- `parent1@dmtt.uz` ... `parent5@dmtt.uz`

## CSV format for transaction import
Flexible headers supported (case-insensitive). Recommended:
```csv
kindergarten,card_last4,merchant_name,merchant_category,amount,transaction_time,currency,reference,status
MTT 1,1122,Office Market,stationery,120000,2026-03-05T09:30:00Z,UZS,REF-10,completed
```

## Suspicious rules
- amount > single transaction limit
- too many transactions per day (>=8)
- outside working hours (08:00–18:00)
- merchant category not allowed
- daily total > daily limit
- monthly total > monthly limit

## What is mocked vs real
- **Mocked:** Click/Payme payment provider adapters, bank integration
- **Real in MVP:** auth flow, RBAC checks, Prisma persistence, invoice generation, CSV import, suspicious detection, dashboards

## Notes
- UI text is primarily Uzbek for operator screens.
- CSV malformed rows are collected as errors and do not crash import.
- Designed for clear extension into real payment/bank integrations later.
