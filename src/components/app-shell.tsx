import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getNavigation } from "@/lib/navigation";
import { LogoutButton } from "@/components/logout-button";

export function AppShell({ role, fullName, children }: { role: UserRole; fullName: string; children: React.ReactNode }) {
  const nav = getNavigation(role);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="hidden lg:block w-72 bg-slate-900 text-slate-100 min-h-screen p-5 space-y-6 sticky top-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">UZ DMTT</p>
            <h1 className="text-lg font-semibold leading-tight">Tuman boshqaruv platformasi</h1>
          </div>

          <nav className="space-y-1">
            {nav.primary.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors">
                <span>{item.label}</span>
                {item.badge ? <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded-full">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>

          {nav.secondary.length > 0 ? (
            <div className="pt-3 border-t border-slate-700 space-y-1">
              {nav.secondary.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </aside>

        <main className="flex-1 min-w-0">
          <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <p className="font-semibold">{fullName}</p>
              <p className="text-sm text-slate-500">Rol: {role}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={role === "district_admin" ? "/admin" : role === "parent" ? "/parent" : "/director"} className="text-sm border rounded px-3 py-1.5">Bosh sahifa</Link>
              <LogoutButton />
            </div>
          </header>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
