import { Alert, buttonClassName, EmptyState, inputClassName, SectionCard, StatusBadge, successButtonClassName } from "@/components/ui-primitives";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clubSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function ClubsPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; error?: string; enrolled?: string; enrollError?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const params = await searchParams;

  const isAdmin = session.user.role === "district_admin";
  if ((session.user.role === "kindergarten_director" || session.user.role === "staff") && !session.user.kindergartenId) redirect("/");
  const canManageClubs = isAdmin || session.user.role === "kindergarten_director";

  const parentProfile =
    session.user.role === "parent" ? await prisma.parentProfile.findUnique({ where: { userId: session.user.id }, include: { children: true } }) : null;
  const kindergartens = isAdmin ? await prisma.kindergarten.findMany({ orderBy: { name: "asc" } }) : [];

  const where = isAdmin
    ? {}
    : session.user.role === "parent"
      ? { isActive: true, kindergartenId: { in: parentProfile?.children.map((c) => c.kindergartenId) || [] } }
      : { kindergartenId: session.user.kindergartenId! };

  const clubs = await prisma.club.findMany({ where, include: { kindergarten: true }, orderBy: { createdAt: "desc" } });

  async function createClub(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || (session.user.role !== "kindergarten_director" && session.user.role !== "district_admin")) return;
    const parsed = clubSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return redirect("/clubs?error=1");
    const kindergartenId = session.user.role === "district_admin" ? parsed.data.kindergartenId : session.user.kindergartenId;
    if (!kindergartenId) return redirect("/clubs?error=1");
    const club = await prisma.club.create({ data: { ...parsed.data, kindergartenId } });
    await logAudit(session.user.id, "club_created", "Club", club.id, club.name);
    revalidatePath("/clubs");
    redirect("/clubs?success=1");
  }

  async function enrollChild(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "parent") return;
    const childId = String(formData.get("childId"));
    const clubId = String(formData.get("clubId"));
    const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return redirect("/clubs?enrollError=1");
    const child = await prisma.child.findFirst({ where: { id: childId, parentId: profile.id } });
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!child || !club || child.kindergartenId !== club.kindergartenId || !club.isActive) return redirect("/clubs?enrollError=1");
    await prisma.enrollment.upsert({
      where: { childId_clubId: { childId, clubId } },
      update: { status: "active", endDate: null },
      create: { childId, clubId, startDate: new Date(), status: "active" }
    });
    revalidatePath("/enrollments");
    revalidatePath("/clubs");
    redirect("/clubs?enrolled=1");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">To'garaklar</h1>
        <p className="text-sm text-slate-500">Qo'shimcha pullik xizmatlar va yozilishlarni boshqarish.</p>
      </div>

      {params?.success ? <Alert tone="success" text="Yangi to'garak muvaffaqiyatli qo'shildi." /> : null}
      {params?.error ? <Alert tone="danger" text="To'garak yaratishda xatolik yuz berdi." /> : null}
      {params?.enrolled ? <Alert tone="success" text="Farzand to'garakka yozildi." /> : null}
      {params?.enrollError ? <Alert tone="danger" text="Yozilish bajarilmadi. Ma'lumotlarni tekshiring." /> : null}

      {canManageClubs ? (
        <SectionCard title="Yangi to'garak qo'shish" description="Direktor va tuman admini uchun yaratilgan boshqaruv formasi.">
          <form action={createClub} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input name="name" placeholder="Nomi" className={inputClassName} required />
            <input name="description" placeholder="Tavsif" className={inputClassName} required />
            <input name="monthlyPrice" placeholder="Oylik narx" className={inputClassName} required />
            <input name="teacherName" placeholder="O'qituvchi" className={inputClassName} required />
            <input name="capacity" placeholder="Sig'im" className={inputClassName} required />
            <input name="schedule" placeholder="Jadval" className={inputClassName} required />
            {isAdmin ? (
              <select name="kindergartenId" className={`md:col-span-2 ${inputClassName}`} required>
                <option value="">MTT tanlang</option>
                {kindergartens.map((kg) => (
                  <option key={kg.id} value={kg.id}>{kg.name}</option>
                ))}
              </select>
            ) : (
              <input type="hidden" name="kindergartenId" value={session.user.kindergartenId ?? ""} />
            )}
            <button className={`md:col-span-2 ${buttonClassName}`}>Saqlash</button>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="To'garaklar ro'yxati">
        {clubs.length === 0 ? <EmptyState text="Hozircha to'garak mavjud emas." /> : null}

        {session.user.role === "parent" ? (
          <div className="space-y-2">
            {clubs.map((club) => {
              const childOptions = parentProfile?.children.filter((ch) => ch.kindergartenId === club.kindergartenId) || [];
              return (
                <article key={club.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{club.name}</p>
                      <p className="text-sm text-slate-500">{club.kindergarten.name}</p>
                    </div>
                    <StatusBadge text={club.isActive ? "Faol" : "Nofaol"} tone={club.isActive ? "success" : "warning"} />
                  </div>
                  <p className="text-sm text-slate-700">{Number(club.monthlyPrice)} so'm / oy</p>
                  {childOptions.length > 0 ? (
                    <form action={enrollChild} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input type="hidden" name="clubId" value={club.id} />
                      <select name="childId" className={inputClassName} required>
                        {childOptions.map((ch) => (
                          <option key={ch.id} value={ch.id}>{ch.fullName}</option>
                        ))}
                      </select>
                      <button className={successButtonClassName}>Yozilish</button>
                    </form>
                  ) : (
                    <p className="text-xs text-slate-500">Bu MTT bo'yicha mos farzand topilmadi.</p>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="p-3">Nomi</th><th>Narx</th><th>MTT</th><th>Holat</th></tr>
              </thead>
              <tbody>
                {clubs.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td>{Number(c.monthlyPrice)} so'm</td>
                    <td>{c.kindergarten.name}</td>
                    <td><StatusBadge text={c.isActive ? "Faol" : "Nofaol"} tone={c.isActive ? "success" : "warning"} /></td>
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
