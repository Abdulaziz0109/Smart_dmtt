import { EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function KindergartensPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const rows = await prisma.kindergarten.findMany({
    include: {
      _count: { select: { children: true, clubs: true } }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">MTTlar</h1>
        <p className="text-sm text-slate-500">Tuman bo'yicha maktabgacha ta'lim tashkilotlari ro'yxati.</p>
      </div>

      <SectionCard title="MTTlar kesimi" description="Har bir MTT bo'yicha asosiy operatsion ko'rsatkichlar.">
        {rows.length === 0 ? (
          <EmptyState text="MTTlar topilmadi." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">Nomi</th>
                  <th>Manzil</th>
                  <th>Bola soni</th>
                  <th>To'garak</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td>{r.address || "Manzil kiritilmagan"}</td>
                    <td>{r._count.children}</td>
                    <td>{r._count.clubs}</td>
                    <td>
                      <StatusBadge
                        text={r._count.children > 0 ? "Faol" : "Past faollik"}
                        tone={r._count.children > 0 ? "success" : "warning"}
                      />
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
