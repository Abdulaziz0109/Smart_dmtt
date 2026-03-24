import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getNavigation } from "@/lib/navigation";
import { LogoutButton } from "@/components/logout-button";

export function AppShell({
  role,
  fullName,
  children
}: {
  role: UserRole;
  fullName: string;
  children: React.ReactNode;
}) {
  const nav = getNavigation(role);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="w-72 bg-slate-900 text-slate-100 min-h-screen p-5 space-y-6 sticky top-0">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Uz DMTT</p>
            <h1 className="text-lg font-semibold">Tuman boshqaruv tizimi</h1>
          </div>

          <nav className="space-y-1">
            {nav.primary.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-slate-800">
                <span>{item.label}</span>
                {item.badge ? <span className="ml-2 text-[10px] bg-red-600 px-2 py-0.5 rounded-full">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>

          {nav.secondary.length > 0 ? (
            <div className="pt-3 border-t border-slate-700 space-y-1">
              {nav.secondary.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 hover:bg-slate-800">
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </aside>

        <main className="flex-1">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <p className="font-semibold">{fullName}</p>
              <p className="text-sm text-slate-500">Rol: {role}</p>
            </div>
            <LogoutButton />
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
