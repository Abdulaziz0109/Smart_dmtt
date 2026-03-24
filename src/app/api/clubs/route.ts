import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clubSchema } from "@/lib/validators";
import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = session.user.role === "district_admin" ? {} : { kindergartenId: session.user.kindergartenId! };
  const clubs = await prisma.club.findMany({ where });
  return NextResponse.json(clubs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = clubSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(parsed.error.flatten(), { status: 400 });

  const kindergartenId = session.user.role === "district_admin" ? parsed.data.kindergartenId : session.user.kindergartenId;
  if (!kindergartenId) return NextResponse.json({ error: "kindergarten required" }, { status: 400 });

  const club = await prisma.club.create({ data: { ...parsed.data, kindergartenId } });
  await logAudit(session.user.id, "club_created", "Club", club.id, club.name);
  return NextResponse.json(club);
}


export async function PUT(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "district_admin" && session.user.role !== "kindergarten_director")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const id = body.id as string;
  const parsed = clubSchema.partial().safeParse(body);
  if (!id || !parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const existing = await prisma.club.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role !== "district_admin" && existing.kindergartenId !== session.user.kindergartenId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const club = await prisma.club.update({ where: { id }, data: parsed.data });
  await logAudit(session.user.id, "club_updated", "Club", club.id, club.name);
  return NextResponse.json(club);
}
