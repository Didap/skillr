import { afterEach, describe, expect, it, vi } from "vitest";
import Pusher from "pusher";

type ServerModule = typeof import("@/lib/pusher/server");
// The module is mocked for every other test file (tests/setup.ts): load the real one
const loadReal = () => vi.importActual<ServerModule>("@/lib/pusher/server");

describe("pusher server", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("is disabled without env vars and publish is a no-op", async () => {
    const { getPusher, publish } = await loadReal();
    expect(getPusher()).toBeNull();
    await expect(publish("private-user-u1", "inbox:update", {})).resolves.toBeUndefined();
  });

  it("swallows trigger failures", async () => {
    vi.stubEnv("PUSHER_APP_ID", "1");
    vi.stubEnv("NEXT_PUBLIC_PUSHER_KEY", "key");
    vi.stubEnv("PUSHER_SECRET", "secret");
    vi.stubEnv("NEXT_PUBLIC_PUSHER_CLUSTER", "eu");
    const trigger = vi.spyOn(Pusher.prototype, "trigger").mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { publish } = await loadReal();
    await expect(publish("private-user-u1", "inbox:update", {}, "123.456")).resolves.toBeUndefined();
    expect(trigger).toHaveBeenCalledWith("private-user-u1", "inbox:update", {}, { socket_id: "123.456" });
  });
});
