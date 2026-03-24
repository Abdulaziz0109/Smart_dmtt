import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlyInvoices } from "@/services/invoice-service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canGenerate = session.user.role === "district_admin" || session.user.role === "kindergarten_director";

  const invoices = await prisma.invoice.findMany({
    where:
      session.user.role === "parent"
        ? { parent: { userId: session.user.id } }
        : session.user.role === "district_admin"
          ? {}
          : { child: { kindergartenId: session.user.kindergartenId! } },
    include: { child: true },
    orderBy: { dueDate: "desc" }
  });

  async function runGenerate(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) return;

    const month = String(formData.get("month") || "");
    if (!/^\d{4}-\d{2}$/.test(month)) return;

    await generateMonthlyInvoices(month);
    revalidatePath("/invoices");
  }

  return (
    <div className="space-y-4">
      {canGenerate ? (
        <form action={runGenerate} className="bg-white p-4 rounded shadow flex items-center gap-2">
          <label htmlFor="month">Invoice oy:</label>
          <input id="month" name="month" type="month" className="border rounded p-2" required />
          <button className="bg-blue-600 text-white rounded px-4 py-2">Generatsiya</button>
        </form>
      ) : null}

      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-xl font-bold mb-3">Hisob-fakturalar</h1>
        <table className="w-full">
          <thead>
            <tr>
              <th>Bola</th>
              <th>Oy</th>
              <th>Summasi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id}>
                <td>{i.child.fullName}</td>
                <td>{i.month}</td>
                <td>{Number(i.amount)}</td>
                <td>{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
