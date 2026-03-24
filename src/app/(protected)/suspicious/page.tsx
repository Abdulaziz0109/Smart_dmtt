import { EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SuspiciousPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const tx = await prisma.cardTransaction.findMany({
    where: { suspiciousFlag: true },
    include: { kindergarten: true },
    orderBy: { transactionTime: "desc" }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Shubhali tranzaksiyalar</h1>
        <p className="text-sm text-slate-500">Risk qoidalari bo'yicha tekshiruv talab qiladigan operatsiyalar.</p>
      </div>

      <SectionCard title="Riskli operatsiyalar" description="Bu ro'yxat tuman admini uchun ustuvor nazorat nuqtasidir.">
        {tx.length === 0 ? (
          <EmptyState text="Shubhali tranzaksiya topilmadi." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">MTT</th>
                  <th>Merchant</th>
                  <th>Kategoriya</th>
                  <th>Summasi</th>
                  <th>Sabab</th>
                  <th>Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {tx.map((t) => (
                  <tr key={t.id} className="border-t bg-red-50/40">
                    <td className="p-3 font-medium">{t.kindergarten.name}</td>
                    <td>{t.merchantName}</td>
                    <td>{t.merchantCategory}</td>
                    <td className="font-semibold text-red-700">{Number(t.amount)} so'm</td>
                    <td>
                      <StatusBadge text={t.suspiciousReason ?? "Risk qoidasi"} tone="danger" />
                    </td>
                    <td>{new Date(t.transactionTime).toLocaleString()}</td>
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
