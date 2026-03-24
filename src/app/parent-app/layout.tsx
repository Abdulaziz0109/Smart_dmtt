import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ParentWebAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "parent") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4">
        <h1 className="font-semibold">DMTT Ota-ona WebApp</h1>
        <p className="text-sm text-slate-500">Telegram ichidan foydalanish uchun moslangan sahifa</p>
      </header>
      <main className="p-4 max-w-xl mx-auto">{children}</main>
    </div>
  );
}
