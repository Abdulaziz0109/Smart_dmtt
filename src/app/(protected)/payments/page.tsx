import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function PaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;

  const payments = await prisma.payment.findMany({
    where:
      session.user.role === "parent"
        ? { invoice: { parent: { userId: session.user.id } } }
        : session.user.role === "district_admin"
          ? {}
          : { invoice: { child: { kindergartenId: session.user.kindergartenId! } } },
    include: { invoice: { include: { child: true } } },
    orderBy: { paidAt: "desc" }
  });

  const unpaid =
    session.user.role === "parent"
      ? await prisma.invoice.findMany({ where: { parent: { userId: session.user.id }, status: "unpaid" }, include: { child: true } })
      : [];

  return (
    <div className="space-y-4">
      {params?.success ? <p className="bg-emerald-100 text-emerald-700 p-3 rounded-lg text-sm">To'lov muvaffaqiyatli amalga oshirildi.</p> : null}
      {params?.error ? <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">To'lov bajarilmadi. Qayta urinib ko'ring.</p> : null}

      {session.user.role === "parent" ? (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">To'lash</h2>
          {unpaid.length === 0 ? (
            <p className="text-sm text-slate-500">To'lanmagan invoice yo'q.</p>
          ) : (
            <form action="/api/payments/pay" method="post" className="grid grid-cols-3 gap-2">
              <input type="hidden" name="returnTo" value="/payments" />
              <select name="invoiceId" className="border rounded p-2" required>
                {unpaid.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.child.fullName} - {Number(u.amount)} ({u.month})
                  </option>
                ))}
              </select>
              <select name="provider" className="border rounded p-2" required>
                <option value="click">Click</option>
                <option value="payme">Payme</option>
              </select>
              <button className="bg-green-600 text-white rounded px-3">To'lash</button>
            </form>
          )}
        </div>
      ) : null}

      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-xl font-bold mb-3">To'lovlar</h1>
        <table className="w-full">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Summasi</th>
              <th>Provider</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.invoice.child.fullName}</td>
                <td>{Number(p.amount)}</td>
                <td>{p.provider}</td>
                <td>{new Date(p.paidAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
