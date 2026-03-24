import { EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function roleLabel(role: string) {
  switch (role) {
    case "district_admin":
      return { text: "Tuman admini", tone: "danger" as const };
    case "kindergarten_director":
      return { text: "Direktor", tone: "warning" as const };
    case "staff":
      return { text: "Xodim", tone: "neutral" as const };
    case "parent":
      return { text: "Ota-ona", tone: "success" as const };
    default:
      return { text: role, tone: "neutral" as const };
  }
}

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");

  const rows = await prisma.user.findMany({
    include: { kindergarten: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Foydalanuvchilar</h1>
        <p className="text-sm text-slate-500">Tizimdagi rollar va MTT bog'liqlik holati.</p>
      </div>

      <SectionCard title="Foydalanuvchilar ro'yxati" description="Tuman admini barcha foydalanuvchilarni nazorat qiladi.">
        {rows.length === 0 ? (
          <EmptyState text="Foydalanuvchi topilmadi." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">F.I.Sh.</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Biriktirilgan MTT</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const badge = roleLabel(r.role);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 font-medium">{r.fullName}</td>
                      <td>{r.email}</td>
                      <td>
                        <StatusBadge text={badge.text} tone={badge.tone} />
                      </td>
                      <td>{r.kindergarten?.name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
