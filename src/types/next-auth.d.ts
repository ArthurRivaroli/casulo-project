import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      householdId: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    householdId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    householdId: string;
  }
}
