import { buttonClassName, SectionCard, StatusBadge } from "@/components/ui-primitives";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function StatCard({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <StatusBadge text="Holat" tone={tone} />
      </div>
    </div>
  );
}

export default async function ParentPage() {
  const session = await auth();
  if (session?.user.role !== "parent") redirect("/");

  const [profile, paidCount] = await Promise.all([
    prisma.parentProfile.findUnique({
      where: { userId: session.user.id },
      include: { children: true, invoices: true }
    }),
    prisma.payment.count({ where: { invoice: { parent: { userId: session.user.id } } } })
  ]);

  if (!profile) return <p className="text-sm text-slate-500">Profil topilmadi.</p>;

  const unpaid = profile.invoices.filter((i) => i.status === "unpaid" || i.status === "overdue");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Ota-ona paneli</h1>
        <p className="text-sm text-slate-500">Farzandlar, yozilishlar va to'lovlarni bir joydan boshqaring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Farzandlar soni" value={profile.children.length} tone="success" />
        <StatCard label="To'lanmagan hisoblar" value={unpaid.length} tone={unpaid.length > 0 ? "warning" : "success"} />
        <StatCard label="Jami to'lovlar" value={paidCount} tone="neutral" />
      </div>

      <SectionCard title="Asosiy xizmatlar" description="Pastdagi bo'limlardan veb yoki mobil ko'rinishda davom etishingiz mumkin.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/children" className="rounded-xl border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100">
            <p className="font-semibold">Farzandlarim</p>
            <p className="text-sm text-slate-500">Farzand kartalari va MTT ma'lumotlari</p>
          </Link>
          <Link href="/enrollments" className="rounded-xl border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100">
            <p className="font-semibold">Yozilishlar</p>
            <p className="text-sm text-slate-500">To'garaklarga yozilish holati</p>
          </Link>
          <Link href="/payments" className="rounded-xl border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100">
            <p className="font-semibold">To'lovlar</p>
            <p className="text-sm text-slate-500">Hisob-kitob va to'lov tarixi</p>
          </Link>
          <Link href="/parent-app" className="rounded-xl border border-blue-200 p-3 bg-blue-50 hover:bg-blue-100">
            <p className="font-semibold text-blue-900">Mobil (Telegram WebApp)</p>
            <p className="text-sm text-blue-700">Tezkor mobil boshqaruv sahifasi</p>
          </Link>
        </div>
        <div className="mt-4">
          <Link href="/parent-app" className={buttonClassName}>Telegram WebApp-ni ochish</Link>
        </div>
      </SectionCard>
    </div>
  );
}
