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
// Realtime is a side effect: tests assert on publish() calls instead
vi.mock("@/lib/pusher/server", () => ({
  getPusher: vi.fn(() => null),
  publish: vi.fn(async () => {}),
  publishAfterResponse: vi.fn((task: () => Promise<unknown>) => {
    void task();
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
