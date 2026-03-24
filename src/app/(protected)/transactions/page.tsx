import { Alert, buttonClassName, EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<{ imported?: string; error?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "parent") redirect("/parent");

  const params = await searchParams;
  const isAdmin = session.user.role === "district_admin";
  const kindergartenId = session.user.kindergartenId;
  if (!isAdmin && !kindergartenId) redirect("/");

  const tx = await prisma.cardTransaction.findMany({
    where: isAdmin ? {} : { kindergartenId },
    include: { kindergarten: true },
    orderBy: { transactionTime: "desc" }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Xarajat tranzaksiyalari</h1>
        <p className="text-sm text-slate-500">Karta operatsiyalari, risk holati va import qilingan ma'lumotlar.</p>
      </div>

      {params?.imported ? <Alert tone="success" text="CSV fayl muvaffaqiyatli yuklandi." /> : null}
      {params?.error ? <Alert tone="danger" text="CSV importda xatolik yuz berdi." /> : null}

      {isAdmin ? (
        <SectionCard title="CSV import" description="Yangi tranzaksiya faylini yuklash orqali monitoringni yangilang.">
          <form action="/api/transactions/import" method="post" encType="multipart/form-data" className="flex flex-col md:flex-row gap-2 md:items-center">
            <input type="file" name="file" accept=".csv" className="border border-slate-300 rounded-xl p-2 text-sm" required />
            <button className={buttonClassName}>CSV yuklash</button>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="Tranzaksiyalar ro'yxati">
        {tx.length === 0 ? (
          <EmptyState text="Tranzaksiya topilmadi." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="p-3">MTT</th><th>Merchant</th><th>Kategoriya</th><th>Summasi</th><th>Sana</th><th>Holat</th></tr>
              </thead>
              <tbody>
                {tx.map((t) => (
                  <tr key={t.id} className={`border-t ${t.suspiciousFlag ? "bg-red-50/40" : ""}`}>
                    <td className="p-3">{t.kindergarten.name}</td>
                    <td className="font-medium">{t.merchantName}</td>
                    <td>{t.merchantCategory}</td>
                    <td className={t.suspiciousFlag ? "text-red-700 font-semibold" : ""}>{Number(t.amount)} so'm</td>
                    <td>{new Date(t.transactionTime).toLocaleString()}</td>
                    <td>
                      {t.suspiciousFlag ? <StatusBadge text={`Shubhali: ${t.suspiciousReason ?? "Risk qoidasi"}`} tone="danger" /> : <StatusBadge text="Normal" tone="success" />}
                    </td>
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
