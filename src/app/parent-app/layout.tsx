import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ParentWebAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "parent") redirect("/");

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <header className="bg-white/95 backdrop-blur border-b px-4 py-3 sticky top-0 z-20">
        <div className="max-w-xl mx-auto">
          <h1 className="font-semibold text-slate-900">DMTT Ota-ona xizmati</h1>
          <p className="text-xs text-slate-500">Telegram WebApp uslubidagi mobil panel</p>
        </div>
      </header>

      <main className="p-3 max-w-xl mx-auto">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] z-20">
        <div className="max-w-xl mx-auto grid grid-cols-2 gap-2 text-sm">
          <Link href="/parent-app" className="text-center py-2 rounded-xl bg-slate-100 text-slate-700 font-medium">Bosh sahifa</Link>
          <Link href="/parent-app/history" className="text-center py-2 rounded-xl bg-slate-100 text-slate-700 font-medium">To'lovlar tarixi</Link>
        </div>
      </nav>
    </div>
  );
}
