import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ParentWebAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "parent") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <h1 className="font-semibold">DMTT Ota-ona xizmati</h1>
        <p className="text-sm text-slate-500">Telegram WebApp ko'rinishi</p>
      </header>
      <main className="p-4 max-w-xl mx-auto">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around text-sm">
        <Link href="/parent-app" className="px-2 py-1">Bosh sahifa</Link>
        <Link href="/parent-app/history" className="px-2 py-1">To'lov tarixi</Link>
      </nav>
    </div>
  );
}
