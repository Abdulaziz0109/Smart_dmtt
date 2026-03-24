import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default async function ParentPage() {
  const session = await auth();
  if (session?.user.role !== "parent") redirect("/");

  const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id }, include: { children: true, invoices: true } });
  if (!profile) return <p>Profil topilmadi</p>;

  const unpaid = profile.invoices.filter((i) => i.status === "unpaid");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Ota-ona sahifasi</h1>
        <p className="text-sm text-slate-500">Asosiy xizmatlar Telegram WebApp sahifasida jamlangan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Farzandlar soni" value={profile.children.length} />
        <StatCard label="To'lanmagan invoice" value={unpaid.length} />
        <StatCard label="Holat" value="Faol" />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <h2 className="font-semibold mb-2">Parent xizmatlar</h2>
        <p className="text-sm text-slate-500 mb-4">Farzandlar, yozilish, invoice va to'lov amallarini mobil uchun moslangan sahifada bajaring.</p>
        <Link href="/parent-app" className="inline-block bg-blue-600 text-white rounded px-4 py-2">Telegram WebApp-ni ochish</Link>
      </div>
    </div>
  );
}
