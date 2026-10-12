import { auth } from "@/auth";

type Role = "professional" | "company" | "pa_admin";

export type AuthedUser = { id: string; role: Role | null; name?: string | null; email?: string | null };

/**
 * Server-action guard: the signed-in user, optionally restricted to roles, or an
 * `{ error }` to return as is. Usage:
 *   const user = await requireUser("company"); if ("error" in user) return user;
 */
export async function requireUser(...roles: Role[]): Promise<AuthedUser | { error: string }> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { error: "Non autorizzato" };
  if (roles.length > 0 && (!user.role || !roles.includes(user.role))) return { error: "Non autorizzato" };
  return { id: user.id, role: user.role ?? null, name: user.name, email: user.email };
}
