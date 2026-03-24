import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { clubSchema } from "@/lib/validators";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ClubsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const parentProfile = session.user.role === "parent"
    ? await prisma.parentProfile.findUnique({ where: { userId: session.user.id }, include: { children: true } })
    : null;

  const where = session.user.role === "district_admin"
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
    if (!parsed.success) return;
    const kindergartenId = session.user.role === "district_admin" ? parsed.data.kindergartenId : session.user.kindergartenId;
    if (!kindergartenId) return;
    const club = await prisma.club.create({ data: { ...parsed.data, kindergartenId } });
    await logAudit(session.user.id, "club_created", "Club", club.id, club.name);
    revalidatePath("/clubs");
  }

  async function enrollChild(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "parent") return;
    const childId = String(formData.get("childId"));
    const clubId = String(formData.get("clubId"));
    const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return;
    const child = await prisma.child.findFirst({ where: { id: childId, parentId: profile.id } });
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!child || !club || child.kindergartenId !== club.kindergartenId) return;
    await prisma.enrollment.upsert({ where: { childId_clubId: { childId, clubId } }, update: { status: "active", endDate: null }, create: { childId, clubId, startDate: new Date(), status: "active" } });
    revalidatePath("/enrollments");
  }

  return <div className="space-y-4"><h1 className="text-xl font-bold">To'garaklar</h1>{session.user.role !== "parent" ? <form action={createClub} className="bg-white p-4 rounded shadow grid grid-cols-2 gap-2"><input name="name" placeholder="Nomi" className="border p-2 rounded" required /><input name="description" placeholder="Tavsif" className="border p-2 rounded" required /><input name="monthlyPrice" placeholder="Narx" className="border p-2 rounded" required /><input name="teacherName" placeholder="O'qituvchi" className="border p-2 rounded" required /><input name="capacity" placeholder="Sig'im" className="border p-2 rounded" required /><input name="schedule" placeholder="Jadval" className="border p-2 rounded" required /><input type="hidden" name="kindergartenId" value={session.user.kindergartenId ?? ""} /><button className="bg-blue-600 text-white rounded px-4 py-2 col-span-2">Saqlash</button></form> : null}<div className="bg-white rounded shadow overflow-auto"><table className="w-full"><thead><tr className="text-left border-b"><th className="p-2">Nomi</th><th>Narx</th><th>MTT</th><th>Holat</th><th></th></tr></thead><tbody>{clubs.map((c)=><tr key={c.id} className="border-b"><td className="p-2">{c.name}</td><td>{Number(c.monthlyPrice)} so'm</td><td>{c.kindergarten.name}</td><td>{c.isActive?"Faol":"Nofaol"}</td><td>{session.user.role==="parent" ? <form action={enrollChild} className="flex gap-2"><input type="hidden" name="clubId" value={c.id}/><select name="childId" className="border rounded p-1">{parentProfile?.children.filter(ch=>ch.kindergartenId===c.kindergartenId).map(ch=><option key={ch.id} value={ch.id}>{ch.fullName}</option>)}</select><button className="bg-green-600 text-white rounded px-2">Yozilish</button></form> : null}</td></tr>)}</tbody></table></div></div>;
}
