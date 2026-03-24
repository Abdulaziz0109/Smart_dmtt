import { prisma } from "@/lib/prisma";

export async function generateMonthlyInvoices(month: string, options?: { kindergartenId?: string }) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "active",
      ...(options?.kindergartenId ? { child: { kindergartenId: options.kindergartenId } } : {})
    },
    include: { child: true, club: true }
  });

  const created = [];
  for (const enr of enrollments) {
    const exists = await prisma.invoice.findUnique({ where: { enrollmentId_month: { enrollmentId: enr.id, month } } });
    if (exists) continue;

    const dueDate = new Date(`${month}-15T00:00:00.000Z`);
    const invoice = await prisma.invoice.create({
      data: {
        parentId: enr.child.parentId,
        childId: enr.childId,
        enrollmentId: enr.id,
        month,
        amount: enr.club.monthlyPrice,
        dueDate,
        status: "unpaid"
      }
    });
    created.push(invoice);
  }

  return created;
}
