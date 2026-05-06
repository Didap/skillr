import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "professional" | "company" | "pa_admin" | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "professional" | "company" | "pa_admin" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "professional" | "company" | "pa_admin" | null;
  }
}
