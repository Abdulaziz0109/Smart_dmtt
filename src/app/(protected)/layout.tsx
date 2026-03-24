import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

function Nav({ role }: { role: string }) {
  const common = [
    { href: "/clubs", label: "To'garaklar" },
    { href: "/invoices", label: "Hisob-fakturalar" },
    { href: "/transactions", label: "Xarajatlar" }
  ];
  const admin = [
    { href: "/admin", label: "Admin dashboard" },
    { href: "/kindergartens", label: "MTTlar" },
    { href: "/users", label: "Foydalanuvchilar" },
    { href: "/suspicious", label: "Shubhali" },
    { href: "/limits", label: "Limitlar" }
  ];
  const director = [
    { href: "/director", label: "Direktor dashboard" },
    { href: "/enrollments", label: "Enrollments" },
    { href: "/payments", label: "To'lovlar" }
  ];
  const parent = [
    { href: "/parent", label: "Ota-ona dashboard" },
    { href: "/children", label: "Farzandlarim" },
    { href: "/payments", label: "To'lov tarixi" },
    { href: "/enrollments", label: "Mening enrollments" }
  ];

  const links = [...common, ...(role === "district_admin" ? admin : role === "parent" ? parent : director)];

  return (
    <nav className="flex gap-4 flex-wrap">
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white p-4 rounded shadow flex justify-between items-center gap-4">
        <div>
          <p className="font-semibold">{session.user.name}</p>
          <p className="text-sm text-slate-500">Rol: {session.user.role}</p>
        </div>
        <div className="flex items-center gap-4">
          <Nav role={session.user.role} />
          <LogoutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
