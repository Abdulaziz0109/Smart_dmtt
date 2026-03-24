import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payInvoiceSchema } from "@/lib/validators";
import { getProvider } from "@/services/payment-providers";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isJson = request.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await request.json() : Object.fromEntries((await request.formData()).entries());

  const parsed = payInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    if (isJson) return NextResponse.json(parsed.error.flatten(), { status: 400 });
    return NextResponse.redirect(new URL("/payments?error=invalid_payload", request.url), 303);
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { parent: true } });
  if (!invoice || invoice.status !== "unpaid") {
    if (isJson) return NextResponse.json({ error: "Invoice unavailable" }, { status: 400 });
    return NextResponse.redirect(new URL("/payments?error=invoice_unavailable", request.url), 303);
  }

  if (session.user.role === "parent" && invoice.parent.userId !== session.user.id) {
    if (isJson) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/payments?error=forbidden", request.url), 303);
  }

  const provider = getProvider(parsed.data.provider);
  const amount = Number(invoice.amount);
  const result = await provider.pay(invoice.id, amount);

  if (!result.success) {
    if (isJson) return NextResponse.json({ error: "Payment failed" }, { status: 400 });
    return NextResponse.redirect(new URL("/payments?error=payment_failed", request.url), 303);
  }

  await prisma.$transaction([
    prisma.invoice.update({ where: { id: invoice.id }, data: { status: "paid" } }),
    prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        provider: parsed.data.provider,
        transactionReference: result.reference,
        paidAt: new Date(),
        status: "succeeded"
      }
    })
  ]);

  await logAudit(session.user.id, "invoice_paid", "Invoice", invoice.id, parsed.data.provider);

  return NextResponse.redirect(new URL("/payments?success=1", request.url), 303);
}
