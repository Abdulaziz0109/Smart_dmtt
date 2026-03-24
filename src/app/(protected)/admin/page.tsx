import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MonthlyBars } from "@/components/charts";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const [kindergartens, activeClubs, enrollments, unpaidInvoices, paidThisMonth, expensesThisMonth, suspiciousCount, suspiciousRows] = await Promise.all([
    prisma.kindergarten.count(),
    prisma.club.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: { status: "active" } }),
    prisma.invoice.count({ where: { status: "unpaid" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: new Date("2026-03-01") } } }),
    prisma.cardTransaction.aggregate({ _sum: { amount: true }, where: { transactionTime: { gte: new Date("2026-03-01") } } }),
    prisma.cardTransaction.count({ where: { suspiciousFlag: true } }),
    prisma.cardTransaction.findMany({ where: { suspiciousFlag: true }, include: { kindergarten: true }, take: 5, orderBy: { transactionTime: "desc" } })
  ]);

  const chartData = [
    { name: "Yan", payments: 1500000, expenses: 1300000 },
    { name: "Fev", payments: 1700000, expenses: 1400000 },
    { name: "Mar", payments: Number(paidThisMonth._sum.amount || 0), expenses: Number(expensesThisMonth._sum.amount || 0) }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tuman boshqaruv dashboard</h1>
        <p className="text-slate-500 text-sm">To'lovlar, xarajatlar va risk holatini bir oynada kuzating.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Jami MTT" value={kindergartens} />
        <StatCard label="Faol to'garaklar" value={activeClubs} />
        <StatCard label="Faol yozilishlar" value={enrollments} />
        <StatCard label="To'lanmagan invoice" value={unpaidInvoices} />
        <StatCard label="Oy bo'yicha tushum" value={`${Number(paidThisMonth._sum.amount || 0)} so'm`} />
        <StatCard label="Oy bo'yicha xarajat" value={`${Number(expensesThisMonth._sum.amount || 0)} so'm`} />
        <StatCard label="Shubhali operatsiya" value={suspiciousCount} />
      </div>

      <MonthlyBars data={chartData} />

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold">So'nggi shubhali operatsiyalar</h2>
        </div>
        {suspiciousRows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Shubhali operatsiyalar topilmadi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">MTT</th><th>Merchant</th><th>Summasi</th><th>Sabab</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.kindergarten.name}</td>
                  <td>{row.merchantName}</td>
                  <td>{Number(row.amount)} so'm</td>
                  <td><span className="text-red-600 font-medium">{row.suspiciousReason ?? "risk"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
