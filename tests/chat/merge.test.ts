import { describe, expect, it } from "vitest";
import { confirmPending, latestReadAt, mergeMessages, type ThreadMessage } from "@/lib/chat/merge";
import type { ChatMessage } from "@/lib/chat/types";

const msg = (id: string, second: number, body = id): ChatMessage => ({
  id, matchId: "m1", senderId: "u1", body, attachment: null,
  createdAt: new Date(Date.UTC(2026, 0, 1, 9, 0, second)).toISOString(),
});
const pending = (clientId: string): ThreadMessage => ({ ...msg(clientId, 59), clientId, status: "sending" });

describe("mergeMessages", () => {
  it("dedupes by id and sorts chronologically", () => {
    const merged = mergeMessages(mergeMessages([], [msg("b", 2), msg("a", 1)]), [msg("b", 2), msg("c", 3)]);
    expect(merged.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(merged.every((m) => m.status === "sent")).toBe(true);
  });

  it("keeps messages still being sent after the server ones", () => {
    const merged = mergeMessages([pending("tmp")], [msg("a", 1)]);
    expect(merged.map((m) => m.id)).toEqual(["a", "tmp"]);
  });
});

describe("confirmPending", () => {
  it("replaces the optimistic message and keeps its clientId as the render key", () => {
    const sentA: ThreadMessage = { ...msg("a", 1), status: "sent" };
    const confirmed = confirmPending([sentA, pending("tmp")], "tmp", msg("real", 2));
    expect(confirmed.map((m) => [m.id, m.clientId, m.status])).toEqual([
      ["a", undefined, "sent"],
      ["real", "tmp", "sent"],
    ]);
  });

  it("does not duplicate a message that arrived over Pusher first", () => {
    const viaPusher = mergeMessages([pending("tmp")], [msg("real", 2)]);
    const confirmed = confirmPending(viaPusher, "tmp", msg("real", 2));
    expect(confirmed.map((m) => m.id)).toEqual(["real"]);
  });
});

describe("latestReadAt", () => {
  const from = (senderId: string, second: number): ChatMessage => ({ ...msg(`${senderId}${second}`, second), senderId });

  it("moves forward to the newest message from the other side", () => {
    expect(latestReadAt(null, [from("u2", 5), from("u2", 9)], "u1")).toBe(msg("x", 9).createdAt);
    expect(latestReadAt(msg("x", 3).createdAt, [from("u2", 5)], "u1")).toBe(msg("x", 5).createdAt);
  });

  it("never moves backwards and ignores the viewer's own messages", () => {
    expect(latestReadAt(msg("x", 20).createdAt, [from("u2", 5)], "u1")).toBe(msg("x", 20).createdAt);
    expect(latestReadAt(null, [from("u1", 5)], "u1")).toBeNull();
    expect(latestReadAt(msg("x", 3).createdAt, [], "u1")).toBe(msg("x", 3).createdAt);
  });
});
