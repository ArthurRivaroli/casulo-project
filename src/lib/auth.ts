import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isLoginBlocked, recordLoginFailure, recordLoginSuccess } from "@/lib/rateLimit";

// Fixed hash so a login attempt for a nonexistent email pays the same
// bcrypt.compare cost as one for a real email — otherwise the response
// time leaks whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("casulo-timing-safety-dummy", 10);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();

        if (isLoginBlocked(email)) {
          throw new Error("Muitas tentativas de login. Tente novamente em alguns minutos.");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(
          credentials.password,
          user?.password ?? DUMMY_HASH,
        );

        if (!user || !isValid) {
          recordLoginFailure(email);
          return null;
        }

        recordLoginSuccess(email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          householdId: user.householdId,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.householdId = user.householdId;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.householdId = token.householdId;
      session.user.isAdmin = token.isAdmin;
      return session;
    },
  },
};
