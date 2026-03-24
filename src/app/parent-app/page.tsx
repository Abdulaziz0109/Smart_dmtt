import { Alert, EmptyState, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function InvoiceStatus({ status }: { status: "unpaid" | "paid" | "cancelled" | "overdue" }) {
  const map = {
    unpaid: { text: "To'lanmagan", tone: "warning" as const },
    paid: { text: "To'langan", tone: "success" as const },
    overdue: { text: "Muddati o'tgan", tone: "danger" as const },
    cancelled: { text: "Bekor qilingan", tone: "neutral" as const }
  };
  return <StatusBadge text={map[status].text} tone={map[status].tone} />;
}

export default async function ParentWebAppPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; error?: string; enrolled?: string; enrollError?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "parent") redirect("/");

  const params = await searchParams;

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      children: { include: { kindergarten: true } },
      invoices: { include: { child: true }, orderBy: { dueDate: "asc" }, take: 30 }
    }
  });

  if (!profile) return <p className="text-sm text-slate-500">Profil topilmadi.</p>;

  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      kindergartenId: { in: profile.children.map((c) => c.kindergartenId) }
    },
    include: { kindergarten: true }
  });

  const unpaidInvoices = profile.invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");
  const paidHistory = await prisma.payment.findMany({
    where: { invoice: { parent: { userId: session.user.id } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" },
    take: 8
  });

  async function enrollFromWebApp(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || session.user.role !== "parent") return redirect("/parent-app?enrollError=1");

    const childId = String(formData.get("childId"));
    const clubId = String(formData.get("clubId"));

    const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) return redirect("/parent-app?enrollError=1");

    const child = await prisma.child.findFirst({ where: { id: childId, parentId: profile.id } });
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!child || !club || !club.isActive || child.kindergartenId !== club.kindergartenId) return redirect("/parent-app?enrollError=1");

    await prisma.enrollment.upsert({
      where: { childId_clubId: { childId, clubId } },
      update: { status: "active", endDate: null },
      create: { childId, clubId, status: "active", startDate: new Date() }
    });

    revalidatePath("/parent-app");
    revalidatePath("/enrollments");
    redirect("/parent-app?enrolled=1");
  }

  return (
    <div className="space-y-4 pb-2">
      {params?.success ? <Alert tone="success" text="To'lov muvaffaqiyatli yakunlandi. Hisobingiz yangilandi." /> : null}
      {params?.error ? <Alert tone="danger" text="To'lov bajarilmadi. Kartangizni tekshirib, qayta urinib ko'ring." /> : null}
      {params?.enrolled ? <Alert tone="success" text="Farzandingiz to'garakka muvaffaqiyatli yozildi." /> : null}
      {params?.enrollError ? <Alert tone="danger" text="Yozilishda xatolik yuz berdi. Ma'lumotlarni tekshirib, qayta urinib ko'ring." /> : null}

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h2 className="font-semibold mb-2">Farzandlarim</h2>
        {profile.children.length === 0 ? <EmptyState text="Farzand qo'shilmagan." /> : null}
        <div className="space-y-2">
          {profile.children.map((child) => (
            <article key={child.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <p className="font-semibold text-slate-900">{child.fullName}</p>
              <p className="text-sm text-slate-600 mt-1">{child.kindergarten.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h2 className="font-semibold mb-2">Mavjud to'garaklar</h2>
        {clubs.length === 0 ? <EmptyState text="Hozircha mos to'garak topilmadi." /> : null}
        <div className="space-y-2">
          {clubs.map((club) => {
            const childOptions = profile.children.filter((child) => child.kindergartenId === club.kindergartenId);
            return (
              <article key={club.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{club.name}</p>
                    <p className="text-sm text-slate-500">{club.kindergarten.name}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{Number(club.monthlyPrice)} so'm/oy</p>
                </div>

                {childOptions.length > 0 ? (
                  <form action={enrollFromWebApp} className="space-y-2">
                    <input type="hidden" name="clubId" value={club.id} />
                    <select name="childId" className="w-full border rounded-xl p-2 text-sm" required>
                      {childOptions.map((child) => (
                        <option key={child.id} value={child.id}>{child.fullName}</option>
                      ))}
                    </select>
                    <button className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm font-medium">To'garakka yozilish</button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500">Bu MTT uchun mos farzand topilmadi.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h2 className="font-semibold mb-2">To'lanmagan hisoblar</h2>
        {unpaidInvoices.length === 0 ? <EmptyState text="To'lanmagan hisoblar mavjud emas." /> : null}
        <div className="space-y-2">
          {unpaidInvoices.map((invoice) => (
            <article key={invoice.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{invoice.child.fullName}</p>
                <p className="text-xs text-slate-600">{invoice.month} • {Number(invoice.amount)} so'm</p>
              </div>
              <InvoiceStatus status={invoice.status} />
            </article>
          ))}
        </div>

        {unpaidInvoices.length > 0 ? (
          <form action="/api/payments/pay" method="post" className="space-y-2 mt-3 border-t pt-3">
            <input type="hidden" name="returnTo" value="/parent-app" />
            <select name="invoiceId" className="w-full border rounded-xl p-2 text-sm" required>
              {unpaidInvoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.child.fullName} — {invoice.month} — {Number(invoice.amount)} so'm
                </option>
              ))}
            </select>
            <select name="provider" className="w-full border rounded-xl p-2 text-sm" required>
              <option value="click">Click</option>
              <option value="payme">Payme</option>
            </select>
            <button className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium">To'lovni amalga oshirish</button>
          </form>
        ) : null}
      </section>

      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h2 className="font-semibold mb-2">So'nggi to'lovlar</h2>
        {paidHistory.length === 0 ? <EmptyState text="To'lov tarixi hozircha bo'sh." /> : null}
        <div className="space-y-2">
          {paidHistory.map((payment) => (
            <article key={payment.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{payment.invoice.child.fullName}</p>
                <StatusBadge text="To'langan" tone="success" />
              </div>
              <p className="text-sm text-slate-700 mt-1">{Number(payment.amount)} so'm • {payment.provider}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(payment.paidAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
