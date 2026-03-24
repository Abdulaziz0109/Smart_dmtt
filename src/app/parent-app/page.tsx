import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParentWebAppPage() {
  const session = await auth();
  if (!session || session.user.role !== "parent") redirect("/");

  const profile = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      children: { include: { kindergarten: true } },
      invoices: { where: { status: "unpaid" }, include: { child: true }, orderBy: { dueDate: "asc" } }
    }
  });

  if (!profile) return <p>Profil topilmadi.</p>;

  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      kindergartenId: { in: profile.children.map((c) => c.kindergartenId) }
    },
    include: { kindergarten: true }
  });

  const payments = await prisma.payment.findMany({
    where: { invoice: { parent: { userId: session.user.id } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" },
    take: 10
  });

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Farzandlarim</h2>
        {profile.children.length === 0 ? <p className="text-sm text-slate-500">Farzand qo'shilmagan.</p> : null}
        <ul className="space-y-2">
          {profile.children.map((child) => (
            <li key={child.id} className="border rounded-lg p-2">
              <p className="font-medium">{child.fullName}</p>
              <p className="text-sm text-slate-500">{child.kindergarten.name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Mavjud to'garaklar</h2>
        {clubs.length === 0 ? <p className="text-sm text-slate-500">Hozircha to'garak topilmadi.</p> : null}
        <div className="space-y-2">
          {clubs.map((club) => (
            <div key={club.id} className="border rounded-lg p-2">
              <p className="font-medium">{club.name}</p>
              <p className="text-sm text-slate-500">{club.kindergarten.name}</p>
              <p className="text-sm">{Number(club.monthlyPrice)} so'm / oy</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">To'lanmagan invoice</h2>
        {profile.invoices.length === 0 ? <p className="text-sm text-slate-500">Qarzlar yo'q.</p> : null}
        <form action="/api/payments/pay" method="post" className="space-y-2">
          <select name="invoiceId" className="w-full border rounded-lg p-2" required>
            {profile.invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.child.fullName} - {invoice.month} - {Number(invoice.amount)} so'm
              </option>
            ))}
          </select>
          <select name="provider" className="w-full border rounded-lg p-2" required>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
          </select>
          <button className="w-full bg-blue-600 text-white rounded-lg p-2">To'lash</button>
        </form>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold mb-2">So'nggi to'lovlar</h2>
        {payments.length === 0 ? <p className="text-sm text-slate-500">To'lovlar hali yo'q.</p> : null}
        <ul className="space-y-2">
          {payments.map((payment) => (
            <li key={payment.id} className="border rounded-lg p-2">
              <p className="font-medium">{payment.invoice.child.fullName}</p>
              <p className="text-sm">{Number(payment.amount)} so'm • {payment.provider}</p>
              <p className="text-xs text-slate-500">{new Date(payment.paidAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
