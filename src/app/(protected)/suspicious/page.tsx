import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SuspiciousPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");
  const tx = await prisma.cardTransaction.findMany({ where: { suspiciousFlag: true }, include: { kindergarten: true }, orderBy: { transactionTime: "desc" } });
  return <div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-3">Shubhali tranzaksiyalar</h1><ul className="space-y-2">{tx.map((t)=><li key={t.id} className="border rounded p-2">{t.kindergarten.name} - {t.merchantName} - {Number(t.amount)} ({t.suspiciousReason})</li>)}</ul></div>;
}
