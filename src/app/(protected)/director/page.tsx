import { KpiCard, PageHeader } from "@/components/page-header";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DirectorPage() {
  const session = await auth();
  if (!session || (session.user.role !== "kindergarten_director" && session.user.role !== "staff")) redirect("/");
  const kindergartenId = session.user.kindergartenId;
  if (!kindergartenId) redirect("/");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [kindergarten, clubs, enrolled, unpaid, income, expenses, suspicious, recentInvoices, recentTx] = await Promise.all([
    prisma.kindergarten.findUnique({ where: { id: kindergartenId } }),
    prisma.club.count({ where: { kindergartenId, isActive: true } }),
    prisma.enrollment.count({ where: { child: { kindergartenId }, status: "active" } }),
    prisma.invoice.count({ where: { child: { kindergartenId }, status: "unpaid" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { invoice: { child: { kindergartenId } }, paidAt: { gte: monthStart } } }),
    prisma.cardTransaction.count({ where: { kindergartenId } }),
    prisma.cardTransaction.count({ where: { kindergartenId, suspiciousFlag: true } }),
    prisma.invoice.findMany({ where: { child: { kindergartenId } }, include: { child: true }, orderBy: { dueDate: "desc" }, take: 8 }),
    prisma.cardTransaction.findMany({ where: { kindergartenId }, orderBy: { transactionTime: "desc" }, take: 8 })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${kindergarten?.name ?? "MTT"} operatsion paneli`}
        description="To'garaklar, yozilishlar, invoice va xarajatlar holati bir joyda."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="Faol to'garak" value={clubs} />
        <KpiCard label="Yozilgan bolalar" value={enrolled} />
        <KpiCard label="To'lanmagan invoice" value={unpaid} />
        <KpiCard label="Joriy oy daromadi" value={`${Number(income._sum.amount || 0)} so'm`} />
        <KpiCard label="Xarajat tranzaksiyalari" value={expenses} />
        <KpiCard label="Shubhali operatsiyalar" value={suspicious} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="So'nggi invoice holati">
          {recentInvoices.length === 0 ? (
            <EmptyState text="Invoice ma'lumotlari topilmadi." />
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr><th className="p-3">Bola</th><th>Oy</th><th>Status</th><th>Summa</th></tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="p-3">{invoice.child.fullName}</td>
                      <td>{invoice.month}</td>
                      <td>
                        {invoice.status === "unpaid" ? <StatusBadge text="To'lanmagan" tone="warning" /> : invoice.status === "paid" ? <StatusBadge text="To'langan" tone="success" /> : invoice.status === "overdue" ? <StatusBadge text="Muddati o'tgan" tone="danger" /> : <StatusBadge text="Bekor qilingan" tone="neutral" />}
                      </td>
                      <td>{Number(invoice.amount)} so'm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="So'nggi xarajat operatsiyalari">
          {recentTx.length === 0 ? (
            <EmptyState text="Xarajat operatsiyalari topilmadi." />
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-3">Merchant</th><th>Summasi</th><th>Holat</th><th>Vaqt</th></tr></thead>
                <tbody>
                  {recentTx.map((tx) => (
                    <tr key={tx.id} className={`border-t ${tx.suspiciousFlag ? "bg-red-50/40" : ""}`}>
                      <td className="p-3">{tx.merchantName}</td>
                      <td>{Number(tx.amount)} so'm</td>
                      <td>{tx.suspiciousFlag ? <StatusBadge text="Shubhali" tone="danger" /> : <StatusBadge text="Normal" tone="success" />}</td>
                      <td>{new Date(tx.transactionTime).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
