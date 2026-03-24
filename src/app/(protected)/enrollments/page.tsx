import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EnrollmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const enrollments = await prisma.enrollment.findMany({
    where: session.user.role === "parent" ? { child: { parent: { userId: session.user.id } } } : session.user.role === "district_admin" ? {} : { child: { kindergartenId: session.user.kindergartenId! } },
    include: { child: true, club: true },
    orderBy: { createdAt: "desc" }
  });
  return <div className="bg-white p-4 rounded shadow"><h1 className="text-xl font-bold mb-3">Enrollments</h1><table className="w-full"><thead><tr><th className="text-left">Bola</th><th className="text-left">To'garak</th><th className="text-left">Holat</th></tr></thead><tbody>{enrollments.map((e)=><tr key={e.id}><td>{e.child.fullName}</td><td>{e.club.name}</td><td>{e.status}</td></tr>)}</tbody></table></div>;
}
