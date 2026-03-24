import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ChildrenPage() {
  const session = await auth();
  if (session?.user.role !== "parent") redirect("/");
  const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id }, include: { children: { include: { kindergarten: true } } } });
  return <div className="bg-white rounded shadow p-4"><h1 className="text-xl font-bold mb-3">Farzandlarim</h1><ul className="space-y-2">{profile?.children.map((c)=><li key={c.id} className="border rounded p-2">{c.fullName} — {c.kindergarten.name}</li>)}</ul></div>;
}
