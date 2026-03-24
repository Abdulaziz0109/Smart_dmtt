import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PaymentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const payments = await prisma.payment.findMany({
    where: session.user.role === "parent" ? { invoice: { parent: { userId: session.user.id } } } : session.user.role === "district_admin" ? {} : { invoice: { child: { kindergartenId: session.user.kindergartenId! } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" }
  });
  const unpaid = session.user.role === "parent" ? await prisma.invoice.findMany({ where: { parent: { userId: session.user.id }, status: "unpaid" }, include: { child: true } }) : [];

  return <div className="space-y-4">{session.user.role === "parent" ? <div className="bg-white p-4 rounded shadow"><h2 className="font-semibold mb-2">To'lash</h2><form action="/api/payments/pay" method="post" className="grid grid-cols-3 gap-2"> <select name="invoiceId" className="border rounded p-2">{unpaid.map((u)=><option key={u.id} value={u.id}>{u.child.fullName} - {Number(u.amount)} ({u.month})</option>)}</select><select name="provider" className="border rounded p-2"><option value="click">Click</option><option value="payme">Payme</option></select><button className="bg-green-600 text-white rounded px-3">To'lash</button></form></div> : null}<div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-3">To'lovlar</h1><table className="w-full"><thead><tr><th>Invoice</th><th>Summasi</th><th>Provider</th><th>Sana</th></tr></thead><tbody>{payments.map((p)=><tr key={p.id}><td>{p.invoice.child.fullName}</td><td>{Number(p.amount)}</td><td>{p.provider}</td><td>{new Date(p.paidAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>;
}
