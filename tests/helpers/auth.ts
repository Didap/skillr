import type { Mock } from "vitest";
import { auth } from "@/auth";

type SessionUser = { id: string; role: "professional" | "company" };

/** Makes auth() (and so requireUser()) return this user, or no session for null. */
export function signInAs(user: SessionUser | null) {
  (auth as unknown as Mock).mockResolvedValue(
    user
      ? { user: { id: user.id, role: user.role, name: null, email: `${user.id}@test.local` }, expires: "2099-01-01T00:00:00.000Z" }
      : null
  );
}
