import { beforeEach, vi } from "vitest";

// next-auth can't run outside Next: tests sign in with signInAs() instead
vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));
// Cache invalidation needs a Next request; actions that call it run fine without
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
// No real emails from tests
vi.mock("@/lib/mail", () => ({
  sendEmail: vi.fn(async () => ({ success: true })),
  sendInBackground: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
