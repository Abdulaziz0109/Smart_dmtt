import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MonthlyBars } from "@/components/charts";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");
  const [kindergartens, activeClubs, enrollments, unpaidInvoices, paidThisMonth, expensesThisMonth, suspiciousCount] = await Promise.all([
    prisma.kindergarten.count(), prisma.club.count({ where: { isActive: true } }), prisma.enrollment.count({ where: { status: "active" } }), prisma.invoice.count({ where: { status: "unpaid" } }), prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: new Date("2026-03-01") } } }), prisma.cardTransaction.aggregate({ _sum: { amount: true }, where: { transactionTime: { gte: new Date("2026-03-01") } } }), prisma.cardTransaction.count({ where: { suspiciousFlag: true } })
  ]);
  const cards = [["Jami MTT", kindergartens],["Faol to'garaklar", activeClubs],["Faol enrollment", enrollments],["To'lanmagan invoice", unpaidInvoices],["Oy to'lovlari", Number(paidThisMonth._sum.amount || 0)],["Oy xarajatlari", Number(expensesThisMonth._sum.amount || 0)],["Shubhali tranzaksiya", suspiciousCount]];
  const chartData = [{ name: "Yan", payments: 1500000, expenses: 1300000 },{ name: "Fev", payments: 1700000, expenses: 1400000 },{ name: "Mar", payments: Number(paidThisMonth._sum.amount || 0), expenses: Number(expensesThisMonth._sum.amount || 0) }];
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Tuman Dashboard</h1><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{cards.map(([k,v]) => <div key={String(k)} className="bg-white p-4 rounded shadow"><p className="text-sm text-slate-500">{k}</p><p className="text-2xl font-semibold">{String(v)}</p></div>)}</div><MonthlyBars data={chartData} /></div>;
}
