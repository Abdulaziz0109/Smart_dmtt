import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      kindergartenId?: string | null;
      districtId?: string | null;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    role: UserRole;
    kindergartenId?: string | null;
    districtId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    kindergartenId?: string | null;
    districtId?: string | null;
  }
}
