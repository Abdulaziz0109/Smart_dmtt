# Smart DMTT (Demo-ready MVP)

Smart DMTT — tuman darajasida MTT (bog'cha) faoliyatini boshqarish uchun web platforma:
- pullik to'garaklar,
- ota-ona yozilishi va to'lovi,
- MTT xarajat kartasi tranzaksiyalarini CSV orqali import qilish,
- shubhali operatsiyalarni aniqlash.

## 1) Tizim nima qiladi?

### District Admin uchun
- tuman bo'yicha KPI va monitoring,
- MTTlar ro'yxati va foydalanuvchilar,
- xarajat limitlari boshqaruvi,
- shubhali tranzaksiyalar nazorati.

### Director/Staff uchun
- o'z MTTsi bo'yicha KPI,
- to'garaklar, yozilishlar, invoice va to'lovlar ko'rinishi,
- xarajat tranzaksiyalari kuzatuvi.

### Parent uchun
- farzandlar, to'garaklar, yozilish holati,
- invoice ko'rish va mock to'lov,
- mobilga mos `/parent-app` Telegram WebApp uslubidagi oqim.

## 2) Texnologiyalar
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL
- NextAuth (credentials)
- Recharts (dashboard)
- Vitest (unit test)

## 3) Lokal ishga tushirish

### Talablar
- Node.js 20+
- PostgreSQL 14+

### Qadamlar
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

So'ng brauzerda oching: `http://localhost:3000`

## 4) Tezkor demo loginlar
Barcha foydalanuvchilar paroli: `Password123!`

- District Admin: `admin@dmtt.uz`
- Director: `director1@dmtt.uz`, `director2@dmtt.uz`, `director3@dmtt.uz`
- Staff: `staff1@dmtt.uz`, `staff2@dmtt.uz`
- Parent: `parent1@dmtt.uz` ... `parent5@dmtt.uz`

## 5) Test
```bash
npm test
```

## 6) Demo paytida nimani ko'rsatish kerak?
1. Admin dashboard (KPI + shubhali operatsiyalar)
2. Director panel (o'z MTT statistikasi)
3. Parent flow: `/parent` -> `/children` -> `/enrollments` -> `/payments`
4. Mobile flow: `/parent-app` va `/parent-app/history`
5. `/transactions` sahifasida CSV import va risk flaglar

## 7) Nima mock qilingan?
- To'lov provayderlari (`Click`, `Payme`) — mock
- Bank integratsiyasi — CSV import orqali mock
- Telegram bot runtime — scaffold darajasida (`src/telegram/bot-menu.ts`)

## 8) Nima production uchun keyin kerak bo'ladi?
- Real payment gateway integratsiyasi
- Real bank feed / API integratsiyasi
- Notification (SMS/Telegram push) pipeline
- Audit va monitoringni SIEM/log platformaga chiqarish
