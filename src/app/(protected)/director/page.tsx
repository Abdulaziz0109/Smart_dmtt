import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default async function DirectorPage() {
  const session = await auth();
  if (!session || (session.user.role !== "kindergarten_director" && session.user.role !== "staff")) redirect("/");
  const kindergartenId = session.user.kindergartenId;
  if (!kindergartenId) redirect("/");

  const [clubs, enrolled, unpaid, income, expenses, suspicious] = await Promise.all([
    prisma.club.count({ where: { kindergartenId, isActive: true } }),
    prisma.enrollment.count({ where: { child: { kindergartenId }, status: "active" } }),
    prisma.invoice.count({ where: { child: { kindergartenId }, status: "unpaid" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { invoice: { child: { kindergartenId } }, paidAt: { gte: new Date("2026-03-01") } } }),
    prisma.cardTransaction.count({ where: { kindergartenId } }),
    prisma.cardTransaction.count({ where: { kindergartenId, suspiciousFlag: true } })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Direktor boshqaruv paneli</h1>
        <p className="text-sm text-slate-500">MTT bo'yicha asosiy ko'rsatkichlar va operatsion holat.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Faol to'garak" value={clubs} />
        <StatCard label="Yozilgan bolalar" value={enrolled} />
        <StatCard label="To'lanmagan invoice" value={unpaid} />
        <StatCard label="Oylik daromad" value={`${Number(income._sum.amount || 0)} so'm`} />
        <StatCard label="Xarajat tranzaksiyalari" value={expenses} />
        <StatCard label="Shubhali operatsiyalar" value={suspicious} />
      </div>
    </div>
  );
}
