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
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
      <h2 className="font-semibold">To'lov tarixi</h2>
      {payments.length === 0 ? <p className="text-sm text-slate-500">To'lovlar hali mavjud emas.</p> : null}
      {payments.map((payment) => (
        <div key={payment.id} className="border rounded-lg p-2">
          <p className="font-medium">{payment.invoice.child.fullName}</p>
          <p className="text-sm">{Number(payment.amount)} so'm • {payment.provider}</p>
          <p className="text-xs text-slate-500">{new Date(payment.paidAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
