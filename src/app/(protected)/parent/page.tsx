import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParentPage() {
  const session = await auth();
  if (session?.user.role !== "parent") redirect("/");
  const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id }, include: { children: true, invoices: true } });
  if (!profile) return <p>Profil topilmadi</p>;
  const unpaid = profile.invoices.filter((i) => i.status === "unpaid").length;
  return <div className="space-y-4"><h1 className="text-xl font-bold">Ota-ona paneli</h1><div className="grid grid-cols-2 gap-4"><div className="bg-white p-4 rounded shadow"><p>Farzandlar</p><p className="text-2xl">{profile.children.length}</p></div><div className="bg-white p-4 rounded shadow"><p>To'lanmagan invoice</p><p className="text-2xl">{unpaid}</p></div></div></div>;
}
