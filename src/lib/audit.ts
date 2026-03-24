import { prisma } from "@/lib/prisma";

export async function logAudit(userId: string | undefined, action: string, entityType: string, entityId?: string, details?: string) {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, details } });
}
