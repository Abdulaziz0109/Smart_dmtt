import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");
  const rows = await prisma.user.findMany({ include: { kindergarten: true } });
  return <div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-2">Foydalanuvchilar</h1><table className="w-full"><thead><tr><th>FIO</th><th>Email</th><th>Role</th><th>MTT</th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.fullName}</td><td>{r.email}</td><td>{r.role}</td><td>{r.kindergarten?.name || "-"}</td></tr>)}</tbody></table></div>;
}
