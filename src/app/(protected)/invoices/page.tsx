import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const invoices = await prisma.invoice.findMany({
    where: session.user.role === "parent" ? { parent: { userId: session.user.id } } : session.user.role === "district_admin" ? {} : { child: { kindergartenId: session.user.kindergartenId! } },
    include: { child: true },
    orderBy: { dueDate: "desc" }
  });
  return <div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-3">Hisob-fakturalar</h1><table className="w-full"><thead><tr><th>Bola</th><th>Oy</th><th>Summasi</th><th>Status</th></tr></thead><tbody>{invoices.map((i)=><tr key={i.id}><td>{i.child.fullName}</td><td>{i.month}</td><td>{Number(i.amount)}</td><td>{i.status}</td></tr>)}</tbody></table></div>;
}
