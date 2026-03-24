import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrollmentSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "parent") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = enrollmentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const profile = await prisma.parentProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Parent profile missing" }, { status: 400 });

  const child = await prisma.child.findFirst({ where: { id: parsed.data.childId, parentId: profile.id } });
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const club = await prisma.club.findUnique({ where: { id: parsed.data.clubId } });
  if (!club || !club.isActive || club.kindergartenId !== child.kindergartenId) return NextResponse.json({ error: "Invalid club" }, { status: 400 });

  const enrollment = await prisma.enrollment.create({ data: { childId: child.id, clubId: club.id, startDate: new Date(), status: "active" } });
  return NextResponse.json(enrollment);
}
