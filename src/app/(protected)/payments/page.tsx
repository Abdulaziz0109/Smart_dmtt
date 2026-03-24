import { Alert, buttonClassName, EmptyState, inputClassName, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PaymentsPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const params = await searchParams;
  if ((session.user.role === "kindergarten_director" || session.user.role === "staff") && !session.user.kindergartenId) redirect("/");

  const payments = await prisma.payment.findMany({
    where:
      session.user.role === "parent"
        ? { invoice: { parent: { userId: session.user.id } } }
        : session.user.role === "district_admin"
          ? {}
          : { invoice: { child: { kindergartenId: session.user.kindergartenId! } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" }
  });

  const unpaid =
    session.user.role === "parent"
      ? await prisma.invoice.findMany({ where: { parent: { userId: session.user.id }, status: { in: ["unpaid", "overdue"] } }, include: { child: true } })
      : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">To'lovlar</h1>
        <p className="text-sm text-slate-500">Hisob-fakturalarni to'lash va to'lov tarixini ko'rish.</p>
      </div>

      {params?.success ? <Alert tone="success" text="To'lov muvaffaqiyatli amalga oshirildi." /> : null}
      {params?.error ? <Alert tone="danger" text="To'lov bajarilmadi. Qayta urinib ko'ring." /> : null}

      {session.user.role === "parent" ? (
        <SectionCard title="To'lov qilish" description="To'lanmagan yoki muddati o'tgan invoice bo'yicha to'lov amalga oshiring.">
          {unpaid.length === 0 ? (
            <EmptyState text="To'lanmagan invoice yo'q." />
          ) : (
            <form action="/api/payments/pay" method="post" className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input type="hidden" name="returnTo" value="/payments" />
              <select name="invoiceId" className={inputClassName} required>
                {unpaid.map((u) => (
                  <option key={u.id} value={u.id}>{u.child.fullName} — {Number(u.amount)} so'm ({u.month})</option>
                ))}
              </select>
              <select name="provider" className={inputClassName} required>
                <option value="click">Click</option>
                <option value="payme">Payme</option>
              </select>
              <button className={buttonClassName}>To'lash</button>
            </form>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="To'lovlar tarixi">
        {payments.length === 0 ? (
          <EmptyState text="To'lovlar mavjud emas." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="p-3">Bola</th><th>Summasi</th><th>Provider</th><th>Sana</th><th>Holat</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">{p.invoice.child.fullName}</td>
                    <td>{Number(p.amount)} so'm</td>
                    <td>{p.provider}</td>
                    <td>{new Date(p.paidAt).toLocaleString()}</td>
                    <td><StatusBadge text="To'langan" tone="success" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
