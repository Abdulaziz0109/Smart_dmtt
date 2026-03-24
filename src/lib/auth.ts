import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          kindergartenId: user.kindergartenId,
          districtId: user.districtId
        };
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.kindergartenId = user.kindergartenId;
        token.districtId = user.districtId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
        kindergartenId: token.kindergartenId,
        districtId: token.districtId
      };
      return session;
    }
  }
};

export async function auth() {
  return getServerSession(authOptions);
}
