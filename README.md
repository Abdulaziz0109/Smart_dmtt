# Kindergarten Management System (Smart DMTT)

District-level MVP for Uzbekistan state kindergartens to manage paid clubs, parent enrollment/payment, and corporate-card expense monitoring.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth (credentials)
- Zod validation
- Recharts dashboards
- Vitest tests

## What is included
- Auth + RBAC: `district_admin`, `kindergarten_director`, `staff`, `parent`
- Organization entities: district, kindergartens, users
- Clubs/services CRUD (create/list/update API)
- Parent children + enrollment flow
- Invoice generation per month for active enrollments
- Payment flow with mock providers (Click, Payme)
- Expense limits per kindergarten
- CSV import for corporate card expenses (local file save + parsing errors)
- Suspicious transaction detection
- District/director/parent dashboards
- Audit logs for key actions

## Requirements
- Node.js 20+
- PostgreSQL 14+

## Environment
Create `.env` from example:

```bash
cp .env.example .env
```

`.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_dmtt?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"
```

## Local run (exact commands)
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## One-command setup after dependencies are installed
```bash
npm run setup
npm run dev
```

## Test
```bash
npm test
```

## Sample login credentials
All users use password: `Password123!`

- District admin: `admin@dmtt.uz`
- Directors: `director1@dmtt.uz`, `director2@dmtt.uz`, `director3@dmtt.uz`
- Staff: `staff1@dmtt.uz`, `staff2@dmtt.uz`
- Parents: `parent1@dmtt.uz` ... `parent5@dmtt.uz`

## CSV import format
Supported headers are flexible/case-insensitive. Recommended format:

```csv
kindergarten,card_last4,merchant_name,merchant_category,amount,transaction_time,currency,reference,status
MTT 1,1122,Office Market,stationery,120000,2026-03-05T09:30:00Z,UZS,REF-10,completed
```

## Suspicious rules
- amount > single transaction limit
- too many transactions in one day (>= 8)
- outside working hours (08:00–18:00)
- merchant category not allowed
- daily total > daily limit
- monthly total > monthly limit

## Mocked integrations
- Payment providers are mocked: Click, Payme
- Bank feed is mocked via CSV import

## Troubleshooting
1. **npm install fails with 403**
   - Check your npm registry/proxy settings:
     ```bash
     npm config get registry
     npm config get proxy
     npm config get https-proxy
     ```
   - Standard registry should be `https://registry.npmjs.org/`.
2. **Prisma migration fails**
   - Confirm PostgreSQL is running and `DATABASE_URL` is reachable.
3. **Cannot log in**
   - Rerun seed: `npm run prisma:seed`.
