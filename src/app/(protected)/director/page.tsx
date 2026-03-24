import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DirectorPage() {
  const session = await auth();
  if (!session || (session.user.role !== "kindergarten_director" && session.user.role !== "staff")) redirect("/");
  const kindergartenId = session.user.kindergartenId!;
  const [clubs, enrolled, unpaid, income, expenses, suspicious] = await Promise.all([
    prisma.club.count({ where: { kindergartenId, isActive: true } }),
    prisma.enrollment.count({ where: { child: { kindergartenId }, status: "active" } }),
    prisma.invoice.count({ where: { child: { kindergartenId }, status: "unpaid" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { invoice: { child: { kindergartenId } }, paidAt: { gte: new Date("2026-03-01") } } }),
    prisma.cardTransaction.count({ where: { kindergartenId } }),
    prisma.cardTransaction.count({ where: { kindergartenId, suspiciousFlag: true } })
  ]);
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[["Faol to'garak",clubs],["Yozilganlar",enrolled],["To'lanmagan",unpaid],["Oylik daromad",Number(income._sum.amount||0)],["Xarajat tranzaksiya",expenses],["Shubhali",suspicious]].map(([k,v])=> <div key={String(k)} className="bg-white p-4 rounded shadow"><p>{String(k)}</p><p className="text-2xl font-bold">{String(v)}</p></div>)}</div>;
}
