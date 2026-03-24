import { auth } from "@/lib/auth";
import { generateMonthlyInvoices } from "@/services/invoice-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const invoices = await generateMonthlyInvoices(parsed.data.month);
  return NextResponse.json({ created: invoices.length });
}
