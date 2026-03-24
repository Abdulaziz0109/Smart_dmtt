import { MonthlyBars } from "@/components/charts";
import { KpiCard, PageHeader } from "@/components/page-header";
import { buttonClassName, EmptyState, inputClassName, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function monthBounds(offsetFromCurrent: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetFromCurrent, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetFromCurrent + 1, 1);
  return { start, end };
}

function shortMonthLabel(date: Date) {
  return date.toLocaleString("uz-UZ", { month: "short" });
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ kindergartenId?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const params = await searchParams;
  const selectedKindergartenId = params?.kindergartenId || "";
  const currentMonthStart = monthBounds(0).start;

  const [kindergartens, activeClubs, enrollments, unpaidInvoices, paidThisMonth, expensesThisMonth, suspiciousCount, suspiciousRows, kgStats, allKindergartens] = await Promise.all([
    prisma.kindergarten.count(),
    prisma.club.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: { status: "active" } }),
    prisma.invoice.count({ where: { status: "unpaid" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: currentMonthStart } } }),
    prisma.cardTransaction.aggregate({ _sum: { amount: true }, where: { transactionTime: { gte: currentMonthStart } } }),
    prisma.cardTransaction.count({ where: { suspiciousFlag: true } }),
    prisma.cardTransaction.findMany({
      where: { suspiciousFlag: true, ...(selectedKindergartenId ? { kindergartenId: selectedKindergartenId } : {}) },
      include: { kindergarten: true },
      take: 10,
      orderBy: { transactionTime: "desc" }
    }),
    prisma.kindergarten.findMany({
      include: {
        _count: { select: { clubs: true, children: true } },
        cardTransactions: { select: { amount: true, suspiciousFlag: true } }
      }
    }),
    prisma.kindergarten.findMany({ orderBy: { name: "asc" } })
  ]);

  const ranges = [monthBounds(-2), monthBounds(-1), monthBounds(0)];
  const [paymentByMonth, expenseByMonth] = await Promise.all([
    Promise.all(
      ranges.map((range) => prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: range.start, lt: range.end } } }))
    ),
    Promise.all(
      ranges.map((range) => prisma.cardTransaction.aggregate({ _sum: { amount: true }, where: { transactionTime: { gte: range.start, lt: range.end } } }))
    )
  ]);

  const chartData = ranges.map((range, index) => ({
    name: shortMonthLabel(range.start),
    payments: Number(paymentByMonth[index]._sum.amount || 0),
    expenses: Number(expenseByMonth[index]._sum.amount || 0)
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tuman nazorat markazi"
        description="Barcha MTTlar bo'yicha moliyaviy va operatsion holatni kuzatish paneli."
        actions={
          <form className="bg-white border border-slate-200 rounded-xl p-2 flex flex-col md:flex-row md:items-center gap-2">
            <label className="text-sm text-slate-500">MTT filtri:</label>
            <select name="kindergartenId" defaultValue={selectedKindergartenId} className={inputClassName}>
              <option value="">Barchasi</option>
              {allKindergartens.map((kg) => (
                <option key={kg.id} value={kg.id}>{kg.name}</option>
              ))}
            </select>
            <button className={buttonClassName}>Qo'llash</button>
          </form>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Jami MTT" value={kindergartens} />
        <KpiCard label="Faol to'garaklar" value={activeClubs} />
        <KpiCard label="Faol yozilishlar" value={enrollments} />
        <KpiCard label="To'lanmagan invoice" value={unpaidInvoices} />
        <KpiCard label="Joriy oy tushumi" value={`${Number(paidThisMonth._sum.amount || 0)} so'm`} hint="Ota-onalar to'lovi" />
        <KpiCard label="Joriy oy xarajati" value={`${Number(expensesThisMonth._sum.amount || 0)} so'm`} hint="Karta tranzaksiyalari" />
        <KpiCard label="Shubhali operatsiya" value={suspiciousCount} hint="Risk qoidalari asosida" />
      </div>

      <MonthlyBars data={chartData} />

      <SectionCard title="MTTlar kesimidagi ko'rsatkichlar" description="Tashkilotlar bo'yicha to'garak, bola va risk kesimi.">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">MTT</th>
              <th>To'garak</th>
              <th>Bola</th>
              <th>Xarajat</th>
              <th>Shubhali</th>
            </tr>
          </thead>
          <tbody>
            {kgStats.map((kg) => {
              const total = kg.cardTransactions.reduce((a, t) => a + Number(t.amount), 0);
              const suspicious = kg.cardTransactions.filter((t) => t.suspiciousFlag).length;
              return (
                <tr key={kg.id} className="border-t">
                  <td className="p-3 font-medium">{kg.name}</td>
                  <td>{kg._count.clubs}</td>
                  <td>{kg._count.children}</td>
                  <td>{total} so'm</td>
                  <td>{suspicious > 0 ? <span className="text-red-600 font-medium">{suspicious}</span> : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="Shubhali operatsiyalar (so'nggi)">
        {suspiciousRows.length === 0 ? (
          <EmptyState text="Tanlangan filtr bo'yicha shubhali operatsiya topilmadi." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr><th className="p-3">MTT</th><th>Merchant</th><th>Summasi</th><th>Sabab</th><th>Vaqt</th></tr>
            </thead>
            <tbody>
              {suspiciousRows.map((row) => (
                <tr key={row.id} className="border-t bg-red-50/40">
                  <td className="p-3">{row.kindergarten.name}</td>
                  <td>{row.merchantName}</td>
                  <td>{Number(row.amount)} so'm</td>
                  <td><StatusBadge text={row.suspiciousReason ?? "Risk qoidasi"} tone="danger" /></td>
                  <td>{new Date(row.transactionTime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
