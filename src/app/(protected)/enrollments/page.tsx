import { EmptyState, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function enrollmentBadge(status: string) {
  switch (status) {
    case "active":
      return <StatusBadge text="Faol" tone="success" />;
    case "completed":
      return <StatusBadge text="Yakunlangan" tone="neutral" />;
    case "paused":
      return <StatusBadge text="To'xtatilgan" tone="warning" />;
    default:
      return <StatusBadge text={status} tone="neutral" />;
  }
}

export default async function EnrollmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user.role === "kindergarten_director" || session.user.role === "staff") && !session.user.kindergartenId) redirect("/");

  const enrollments = await prisma.enrollment.findMany({
    where:
      session.user.role === "parent"
        ? { child: { parent: { userId: session.user.id } } }
        : session.user.role === "district_admin"
          ? {}
          : { child: { kindergartenId: session.user.kindergartenId! } },
    include: { child: true, club: true },
    orderBy: { createdAt: "desc" }
  });

  const isParent = session.user.role === "parent";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Yozilishlar</h1>
        <p className="text-sm text-slate-500">Farzandlar va to'garaklar bo'yicha yozilish holatlari.</p>
      </div>

      <SectionCard title={isParent ? "Mening yozilishlarim" : "Yozilishlar jadvali"}>
        {enrollments.length === 0 ? (
          <EmptyState text="Yozilishlar topilmadi." />
        ) : isParent ? (
          <div className="space-y-2">
            {enrollments.map((e) => (
              <article key={e.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.child.fullName}</p>
                    <p className="text-sm text-slate-600">{e.club.name}</p>
                  </div>
                  {enrollmentBadge(e.status)}
                </div>
                <p className="text-xs text-slate-500 mt-2">Boshlangan sana: {new Date(e.startDate).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">Bola</th>
                  <th>To'garak</th>
                  <th>Holat</th>
                  <th>Boshlangan sana</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3 font-medium">{e.child.fullName}</td>
                    <td>{e.club.name}</td>
                    <td>{enrollmentBadge(e.status)}</td>
                    <td>{new Date(e.startDate).toLocaleDateString()}</td>
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
