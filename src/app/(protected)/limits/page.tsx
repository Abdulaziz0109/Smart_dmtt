import { Alert, buttonClassName, EmptyState, inputClassName, SectionCard } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LimitsPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string }> }) {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const params = await searchParams;
  const limits = await prisma.expenseLimit.findMany({ include: { kindergarten: true }, orderBy: { kindergarten: { name: "asc" } } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Limit sozlamalari</h1>
        <p className="text-sm text-slate-500">MTTlar uchun kunlik, bir martalik va oylik xarajat limitlari.</p>
      </div>

      {params?.success ? <Alert tone="success" text="Limit muvaffaqiyatli yangilandi." /> : null}
      {params?.error ? <Alert tone="danger" text="Limitni saqlashda xatolik yuz berdi." /> : null}

      <SectionCard title="Limitni yangilash" description="Tanlangan MTT uchun yangi limit qiymatlarini kiriting.">
        <form action="/api/limits" method="post" className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className={inputClassName} name="kindergartenId" required>
            {limits.map((l) => (
              <option key={l.id} value={l.kindergartenId}>{l.kindergarten.name}</option>
            ))}
          </select>
          <input name="dailyLimit" placeholder="Kunlik limit" className={inputClassName} required />
          <input name="singleTransactionLimit" placeholder="Bir martalik limit" className={inputClassName} required />
          <input name="monthlyLimit" placeholder="Oylik limit" className={inputClassName} required />
          <button className={`md:col-span-4 ${buttonClassName}`}>Saqlash</button>
        </form>
      </SectionCard>

      <SectionCard title="Amaldagi limitlar">
        {limits.length === 0 ? (
          <EmptyState text="Limitlar hali sozlanmagan." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="p-3">MTT</th><th>Kunlik</th><th>Bir martalik</th><th>Oylik</th></tr>
              </thead>
              <tbody>
                {limits.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3 font-medium">{l.kindergarten.name}</td>
                    <td>{Number(l.dailyLimit)} so'm</td>
                    <td>{Number(l.singleTransactionLimit)} so'm</td>
                    <td>{Number(l.monthlyLimit)} so'm</td>
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
