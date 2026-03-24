import { EmptyState, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParentPaymentHistoryPage() {
  const session = await auth();
  if (!session || session.user.role !== "parent") redirect("/");

  const payments = await prisma.payment.findMany({
    where: { invoice: { parent: { userId: session.user.id } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" }
  });

  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
      <div>
        <h2 className="font-semibold">To'lovlar tarixi</h2>
        <p className="text-xs text-slate-500">Barcha amalga oshirilgan to'lovlar va vaqt ma'lumotlari.</p>
      </div>

      {payments.length === 0 ? <EmptyState text="To'lovlar hali mavjud emas." /> : null}

      <div className="space-y-2">
        {payments.map((payment) => (
          <article key={payment.id} className="border rounded-xl p-3 bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-slate-900">{payment.invoice.child.fullName}</p>
              <StatusBadge text="To'langan" tone="success" />
            </div>
            <p className="text-sm text-slate-700 mt-1">{Number(payment.amount)} so'm • {payment.provider}</p>
            <p className="text-xs text-slate-500 mt-1">{new Date(payment.paidAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
