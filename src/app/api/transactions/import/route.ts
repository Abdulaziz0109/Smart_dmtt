import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { parseTransactionsCsv } from "@/services/csv";
import { evaluateSuspicious } from "@/services/suspicious";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "district_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "CSV file required" }, { status: 400 });

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const filePath = path.join(process.cwd(), "uploads", fileName);
  const content = await file.text();
  await fs.writeFile(filePath, content, "utf8");

  const { rows, errors } = parseTransactionsCsv(content);

  const categories = await prisma.allowedMerchantCategory.findMany({ where: { active: true } });
  const allowed = categories.map((c) => c.code);

  let imported = 0;
  for (const row of rows) {
    const kindergarten = await prisma.kindergarten.findFirst({ where: { name: { equals: row.kindergartenName, mode: "insensitive" } } });
    if (!kindergarten) {
      errors.push(`MTT topilmadi: ${row.kindergartenName}`);
      continue;
    }

    const limit = await prisma.expenseLimit.findUnique({ where: { kindergartenId: kindergarten.id } });
    if (!limit) {
      errors.push(`Limit topilmadi: ${kindergarten.name}`);
      continue;
    }

    const txTime = new Date(row.transactionTime);
    const dayStart = new Date(txTime); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(txTime); dayEnd.setHours(23,59,59,999);
    const monthStart = new Date(txTime.getFullYear(), txTime.getMonth(), 1);
    const monthEnd = new Date(txTime.getFullYear(), txTime.getMonth() + 1, 0, 23, 59, 59, 999);

    const [sameDay, sameMonth] = await Promise.all([
      prisma.cardTransaction.findMany({ where: { kindergartenId: kindergarten.id, transactionTime: { gte: dayStart, lte: dayEnd } } }),
      prisma.cardTransaction.findMany({ where: { kindergartenId: kindergarten.id, transactionTime: { gte: monthStart, lte: monthEnd } } })
    ]);

    const sameDayTotal = sameDay.reduce((acc, t) => acc + Number(t.amount), row.amount);
    const sameMonthTotal = sameMonth.reduce((acc, t) => acc + Number(t.amount), row.amount);
    const signal = evaluateSuspicious({ amount: row.amount, merchantCategory: row.merchantCategory, transactionTime: txTime }, limit, allowed, sameDay.length + 1, sameDayTotal, sameMonthTotal);

    const tx = await prisma.cardTransaction.create({
      data: {
        kindergartenId: kindergarten.id,
        cardLast4: row.cardLast4,
        merchantName: row.merchantName,
        merchantCategory: row.merchantCategory,
        amount: row.amount,
        transactionTime: txTime,
        currency: row.currency,
        rawReference: row.rawReference,
        status: row.status,
        suspiciousFlag: signal.suspicious,
        suspiciousReason: signal.reason
      }
    });

    if (signal.suspicious) await logAudit(session.user.id, "suspicious_transaction_flagged", "CardTransaction", tx.id, signal.reason || undefined);
    imported += 1;
  }

  await logAudit(session.user.id, "csv_imported", "CardTransaction", undefined, `imported=${imported}`);
  return NextResponse.json({ imported, errors });
}
