import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseLimitSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "district_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = Object.fromEntries((await request.formData()).entries());
  const parsed = expenseLimitSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.redirect(new URL("/limits?error=1", request.url));

  await prisma.expenseLimit.upsert({
    where: { kindergartenId: parsed.data.kindergartenId },
    create: parsed.data,
    update: parsed.data
  });

  return NextResponse.redirect(new URL("/limits?success=1", request.url));
}
