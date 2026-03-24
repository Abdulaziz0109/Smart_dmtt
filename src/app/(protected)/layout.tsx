import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <AppShell role={session.user.role} fullName={session.user.name ?? "Foydalanuvchi"}>
      {children}
    </AppShell>
  );
}
