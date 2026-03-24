import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const tx = await prisma.cardTransaction.findMany({
    where: session.user.role === "district_admin" ? {} : { kindergartenId: session.user.kindergartenId! },
    include: { kindergarten: true },
    orderBy: { transactionTime: "desc" }
  });

  return <div className="space-y-4"><h1 className="text-xl font-bold">Xarajat tranzaksiyalari</h1><form action="/api/transactions/import" method="post" encType="multipart/form-data" className="bg-white p-4 rounded shadow flex gap-2 items-center"><input type="file" name="file" accept=".csv" className="border p-2 rounded" /><button className="bg-blue-600 text-white rounded px-4 py-2">CSV yuklash</button></form><div className="bg-white p-4 rounded shadow overflow-auto"><table className="w-full"><thead><tr><th>MTT</th><th>Merchant</th><th>Kategoriya</th><th>Summasi</th><th>Sana</th><th>Flag</th></tr></thead><tbody>{tx.map((t)=><tr key={t.id}><td>{t.kindergarten.name}</td><td>{t.merchantName}</td><td>{t.merchantCategory}</td><td>{Number(t.amount)}</td><td>{new Date(t.transactionTime).toLocaleString()}</td><td>{t.suspiciousFlag ? <span className="text-red-600">Shubhali ({t.suspiciousReason})</span> : "OK"}</td></tr>)}</tbody></table></div></div>;
}
