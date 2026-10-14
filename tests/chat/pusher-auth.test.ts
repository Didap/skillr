import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/pusher/auth/route";
import { getPusher } from "@/lib/pusher/server";
import { signInAs } from "../helpers/auth";
import { createStranger, resetDb, seedMatch } from "../helpers/db";

const authorizeChannel = vi.fn((socketId: string, channel: string) => ({ auth: `key:${socketId}:${channel}` }));

function request(channel: string, socketId = "123.456") {
  return new Request("http://localhost/api/pusher/auth", {
    method: "POST",
    body: new URLSearchParams({ socket_id: socketId, channel_name: channel }),
  });
}

describe("POST /api/pusher/auth", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(getPusher).mockReturnValue({ authorizeChannel } as never);
  });

  it("answers 503 when realtime is not configured", async () => {
    vi.mocked(getPusher).mockReturnValue(null);
    expect((await POST(request("private-user-x"))).status).toBe(503);
  });

  it("answers 401 without a session", async () => {
    signInAs(null);
    expect((await POST(request("private-user-x"))).status).toBe(401);
  });

  it("authorizes your own user channel only", async () => {
    const { pro, company } = await seedMatch();
    signInAs(pro);
    const ok = await POST(request(`private-user-${pro.id}`));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ auth: `key:123.456:private-user-${pro.id}` });
    expect((await POST(request(`private-user-${company.id}`))).status).toBe(403);
  });

  it("authorizes match channels for participants of mutual matches only", async () => {
    const { match, pro } = await seedMatch();
    const pending = await seedMatch({ mutual: false });
    signInAs(pro);
    expect((await POST(request(`private-match-${match.id}`))).status).toBe(200);
    signInAs(pending.pro);
    expect((await POST(request(`private-match-${pending.match.id}`))).status).toBe(403);
    signInAs(await createStranger());
    expect((await POST(request(`private-match-${match.id}`))).status).toBe(403);
  });

  it("refuses unknown channels and malformed requests", async () => {
    const { pro } = await seedMatch();
    signInAs(pro);
    expect((await POST(request("presence-lobby"))).status).toBe(403);
    expect((await POST(new Request("http://localhost/api/pusher/auth", { method: "POST", body: new URLSearchParams({}) }))).status).toBe(400);
  });
});
