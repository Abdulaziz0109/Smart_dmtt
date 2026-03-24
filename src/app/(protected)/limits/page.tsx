import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LimitsPage() {
  const session = await auth();
  if (session?.user.role !== "district_admin") redirect("/");
  const limits = await prisma.expenseLimit.findMany({ include: { kindergarten: true } });
  return <div className="space-y-4"><h1 className="text-xl font-bold">Limit sozlamalari</h1><form action="/api/limits" method="post" className="bg-white p-4 rounded shadow grid grid-cols-4 gap-2"><select className="border p-2 rounded" name="kindergartenId">{limits.map((l)=><option key={l.id} value={l.kindergartenId}>{l.kindergarten.name}</option>)}</select><input name="dailyLimit" placeholder="Kunlik" className="border p-2 rounded"/><input name="singleTransactionLimit" placeholder="Bir martalik" className="border p-2 rounded"/><input name="monthlyLimit" placeholder="Oylik" className="border p-2 rounded"/><button className="col-span-4 bg-blue-600 text-white rounded p-2">Saqlash</button></form><div className="bg-white rounded shadow"><table className="w-full"><thead><tr><th>MTT</th><th>Kunlik</th><th>Bir martalik</th><th>Oylik</th></tr></thead><tbody>{limits.map((l)=><tr key={l.id}><td>{l.kindergarten.name}</td><td>{Number(l.dailyLimit)}</td><td>{Number(l.singleTransactionLimit)}</td><td>{Number(l.monthlyLimit)}</td></tr>)}</tbody></table></div></div>;
}
