import { auth } from "@/lib/auth";
import { generateMonthlyInvoices } from "@/services/invoice-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { month } = await request.json();
  if (!month) return NextResponse.json({ error: "month required YYYY-MM" }, { status: 400 });
  const invoices = await generateMonthlyInvoices(month);
  return NextResponse.json({ created: invoices.length });
}
