import { Alert, buttonClassName, EmptyState, inputClassName, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlyInvoices } from "@/services/invoice-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const invoiceStatusMap = {
  paid: { text: "To'langan", tone: "success" as const },
  unpaid: { text: "To'lanmagan", tone: "warning" as const },
  overdue: { text: "Muddati o'tgan", tone: "danger" as const },
  cancelled: { text: "Bekor qilingan", tone: "neutral" as const }
};

export default async function InvoicesPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user.role === "kindergarten_director" || session.user.role === "staff") && !session.user.kindergartenId) redirect("/");

  const params = await searchParams;
  const canGenerate = session.user.role === "district_admin" || session.user.role === "kindergarten_director";
  const invoices = await prisma.invoice.findMany({
    where:
      session.user.role === "parent"
        ? { parent: { userId: session.user.id } }
        : session.user.role === "district_admin"
          ? {}
          : { child: { kindergartenId: session.user.kindergartenId! } },
    include: { child: true },
    orderBy: { dueDate: "desc" }
  });

  async function runGenerate(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) return;
    const month = String(formData.get("month") || "");
    if (!/^\d{4}-\d{2}$/.test(month)) return redirect("/invoices?error=1");
    const scopeKindergartenId = session.user.role === "kindergarten_director" ? session.user.kindergartenId ?? undefined : undefined;
    await generateMonthlyInvoices(month, { kindergartenId: scopeKindergartenId });
    revalidatePath("/invoices");
    redirect("/invoices?success=1");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Hisob-fakturalar</h1>
        <p className="text-sm text-slate-500">Yaratilgan invoice holati va to'lov intizomini kuzating.</p>
      </div>

      {params?.success ? <Alert tone="success" text="Oylik invoice generatsiyasi muvaffaqiyatli bajarildi." /> : null}
      {params?.error ? <Alert tone="danger" text="Invoice generatsiyasida xatolik yuz berdi." /> : null}

      {canGenerate ? (
        <SectionCard title="Oylik invoice generatsiyasi" description="Tanlangan oy bo'yicha barcha tegishli invoice'lar yaratiladi.">
          <form action={runGenerate} className="flex flex-col md:flex-row md:items-center gap-2">
            <label htmlFor="month" className="text-sm text-slate-600">Oy:</label>
            <input id="month" name="month" type="month" className={`${inputClassName} md:max-w-xs`} required />
            <button className={buttonClassName}>Generatsiya qilish</button>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard title="Invoice ro'yxati">
        {invoices.length === 0 ? (
          <EmptyState text="Invoice topilmadi." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="p-3">Bola</th><th>Oy</th><th>Summasi</th><th>To'lov muddati</th><th>Status</th></tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const badge = invoiceStatusMap[i.status as keyof typeof invoiceStatusMap] ?? { text: i.status, tone: "neutral" as const };
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="p-3 font-medium">{i.child.fullName}</td>
                      <td>{i.month}</td>
                      <td>{Number(i.amount)} so'm</td>
                      <td>{new Date(i.dueDate).toLocaleDateString()}</td>
                      <td><StatusBadge text={badge.text} tone={badge.tone} /></td>
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
