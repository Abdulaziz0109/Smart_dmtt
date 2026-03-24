import { UserRole } from "@prisma/client";

export function requireRole(role: UserRole, allowed: UserRole[]) {
  return allowed.includes(role);
}

export function canAccessKindergarten(role: UserRole, userKindergartenId: string | null | undefined, resourceKindergartenId: string) {
  if (role === "district_admin") return true;
  if (role === "kindergarten_director" || role === "staff") return userKindergartenId === resourceKindergartenId;
  return false;
}
