import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function KindergartensPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");
  const rows = await prisma.kindergarten.findMany();
  return <div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-2">MTTlar</h1><ul>{rows.map((r)=><li key={r.id}>{r.name} - {r.address}</li>)}</ul></div>;
}
