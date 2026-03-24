import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function StatusBadge({ status }: { status: "unpaid" | "paid" | "cancelled" | "overdue" }) {
  const map = {
    unpaid: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600"
  };
  const label = { unpaid: "To'lanmagan", paid: "To'langan", overdue: "Kechikkan", cancelled: "Bekor qilingan" }[status];
  return <span className={`text-xs px-2 py-1 rounded-full ${map[status]}`}>{label}</span>;
}

export default async function ParentWebAppPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "parent") redirect("/");

  const params = await searchParams;

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      children: { include: { kindergarten: true } },
      invoices: { include: { child: true }, orderBy: { dueDate: "asc" }, take: 20 }
    }
  });

  if (!profile) return <p>Profil topilmadi.</p>;

  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      kindergartenId: { in: profile.children.map((c) => c.kindergartenId) }
    },
    include: { kindergarten: true }
  });

  const unpaidInvoices = profile.invoices.filter((i) => i.status === "unpaid");

  async function enrollFromWebApp(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "parent") return;

    const childId = String(formData.get("childId"));
    const clubId = String(formData.get("clubId"));

    const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return;

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: profile.id } });
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!child || !club || !club.isActive || child.kindergartenId !== club.kindergartenId) return;

    await prisma.enrollment.upsert({
      where: { childId_clubId: { childId, clubId } },
      update: { status: "active", endDate: null },
      create: { childId, clubId, status: "active", startDate: new Date() }
    });

    revalidatePath("/parent-app");
    revalidatePath("/enrollments");
  }

  return (
    <div className="space-y-4">
      {params?.success ? <p className="bg-emerald-100 text-emerald-700 p-3 rounded-lg text-sm">To'lov muvaffaqiyatli amalga oshirildi.</p> : null}
      {params?.error ? <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">Amal bajarilmadi. Iltimos, qayta urinib ko'ring.</p> : null}

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Farzandlarim</h2>
        {profile.children.length === 0 ? <p className="text-sm text-slate-500">Farzand qo'shilmagan.</p> : null}
        <ul className="space-y-2">
          {profile.children.map((child) => (
            <li key={child.id} className="border rounded-lg p-2">
              <p className="font-medium">{child.fullName}</p>
              <p className="text-sm text-slate-500">{child.kindergarten.name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Mavjud to'garaklar</h2>
        {clubs.length === 0 ? <p className="text-sm text-slate-500">Hozircha to'garak topilmadi.</p> : null}
        <div className="space-y-2">
          {clubs.map((club) => {
            const childOptions = profile.children.filter((child) => child.kindergartenId === club.kindergartenId);
            return (
              <div key={club.id} className="border rounded-lg p-2 space-y-2">
                <p className="font-medium">{club.name}</p>
                <p className="text-sm text-slate-500">{club.kindergarten.name}</p>
                <p className="text-sm">{Number(club.monthlyPrice)} so'm / oy</p>
                {childOptions.length > 0 ? (
                  <form action={enrollFromWebApp} className="flex gap-2">
                    <input type="hidden" name="clubId" value={club.id} />
                    <select name="childId" className="flex-1 border rounded-lg p-2" required>
                      {childOptions.map((child) => (
                        <option key={child.id} value={child.id}>{child.fullName}</option>
                      ))}
                    </select>
                    <button className="bg-emerald-600 text-white rounded-lg px-3">Yozilish</button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-400">Bu MTT uchun mos farzand topilmadi.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Invoice ro'yxati</h2>
        {profile.invoices.length === 0 ? <p className="text-sm text-slate-500">Invoice topilmadi.</p> : null}
        <div className="space-y-2">
          {profile.invoices.map((invoice) => (
            <div key={invoice.id} className="border rounded-lg p-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{invoice.child.fullName}</p>
                <p className="text-xs text-slate-500">{invoice.month} • {Number(invoice.amount)} so'm</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">To'lov qilish</h2>
        {unpaidInvoices.length === 0 ? <p className="text-sm text-slate-500">To'lanmagan invoice yo'q.</p> : null}
        {unpaidInvoices.length > 0 ? (
          <form action="/api/payments/pay" method="post" className="space-y-2">
            <input type="hidden" name="returnTo" value="/parent-app" />
            <select name="invoiceId" className="w-full border rounded-lg p-2" required>
              {unpaidInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.child.fullName} - {invoice.month} - {Number(invoice.amount)} so'm
                </option>
              ))}
            </select>
            <select name="provider" className="w-full border rounded-lg p-2" required>
              <option value="click">Click</option>
              <option value="payme">Payme</option>
            </select>
            <button className="w-full bg-blue-600 text-white rounded-lg p-2">To'lash</button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
