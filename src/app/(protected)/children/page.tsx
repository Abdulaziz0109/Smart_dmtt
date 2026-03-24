import { EmptyState, SectionCard } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ChildrenPage() {
  const session = await auth();
  if (session?.user.role !== "parent") redirect("/");

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { kindergarten: true }, orderBy: { fullName: "asc" } } }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Farzandlarim</h1>
        <p className="text-sm text-slate-500">Farzandlaringizning MTT bo'yicha biriktirilgan ma'lumotlari.</p>
      </div>

      <SectionCard title="Farzandlar ro'yxati">
        {profile?.children.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.children.map((c) => (
              <div key={c.id} className="border rounded-xl p-3 bg-slate-50">
                <p className="font-semibold text-slate-900">{c.fullName}</p>
                <p className="text-sm text-slate-600 mt-1">{c.kindergarten.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Farzandlar hali qo'shilmagan." />
        )}
      </SectionCard>
    </div>
  );
}
