import { beforeEach, describe, expect, it } from "vitest";
import { getMessages, getUnreadTotal, markRead, sendMessage } from "@/app/actions/chat";
import { loadChatPreviews } from "@/lib/chat/summaries";
import { publish } from "@/lib/pusher/server";
import { signInAs } from "../helpers/auth";
import { createProfessional, resetDb, seedMatch } from "../helpers/db";

async function send(user: Parameters<typeof signInAs>[0], matchId: string, body: string) {
  signInAs(user);
  const res = await sendMessage(matchId, { clientId: crypto.randomUUID(), body });
  if ("error" in res) throw new Error(res.error);
  return res.data.message;
}

async function total(user: Parameters<typeof signInAs>[0]) {
  signInAs(user);
  const res = await getUnreadTotal();
  if ("error" in res) throw new Error(res.error);
  return res.data;
}

describe("read state", () => {
  beforeEach(resetDb);

  it("counts only the other side's messages", async () => {
    const { match, pro, company } = await seedMatch();
    await send(pro, match.id, "uno");
    await send(pro, match.id, "due");
    expect(await total(company)).toBe(2);
    // Own messages never count, from any tab
    expect(await total(pro)).toBe(0);
  });

  it("markRead clears the count, returns readAt and covers the read receipt", async () => {
    const { match, pro, company } = await seedMatch();
    const message = await send(pro, match.id, "Ciao");
    signInAs(company);
    const res = await markRead(match.id);
    if ("error" in res) throw new Error(res.error);
    expect(await total(company)).toBe(0);
    expect(res.data.readAt >= message.createdAt).toBe(true);

    signInAs(pro);
    const thread = await getMessages(match.id);
    if ("error" in thread) throw new Error(thread.error);
    expect(thread.data.otherLastReadAt).toBe(res.data.readAt);
  });

  it("counts messages that arrive after the read marker", async () => {
    const { match, pro, company } = await seedMatch();
    await send(pro, match.id, "uno");
    signInAs(company);
    await markRead(match.id);
    await send(pro, match.id, "due");
    expect(await total(company)).toBe(1);
  });

  it("adds up across conversations and ignores matches that are not mutual", async () => {
    const { match, company, pro } = await seedMatch();
    const other = await seedMatch({ company, pro: await createProfessional("Sara Verdi") });
    await send(pro, match.id, "uno");
    await send(other.pro, other.match.id, "due");
    expect(await total(company)).toBe(2);
  });

  it("publishes the read receipt to the thread and an inbox update to the reader", async () => {
    const { match, pro, company } = await seedMatch();
    await send(pro, match.id, "Ciao");
    signInAs(company);
    const res = await markRead(match.id, "123.456");
    if ("error" in res) throw new Error(res.error);
    expect(publish).toHaveBeenCalledWith(`private-match-${match.id}`, "message:read", { userId: company.id, readAt: res.data.readAt }, "123.456");
    expect(publish).toHaveBeenCalledWith(`private-user-${company.id}`, "inbox:update", { matchId: match.id });
  });

  it("previews the last message and unread count per match", async () => {
    const { match, pro, company } = await seedMatch();
    const empty = await seedMatch({ company, pro: await createProfessional("Sara Verdi") });
    await send(pro, match.id, "uno");
    await send(company, match.id, "due");
    await send(pro, match.id, "tre");

    const previews = await loadChatPreviews(company.id, [match.id, empty.match.id]);
    expect(previews.get(match.id)).toEqual({
      lastMessage: { body: "tre", hasAttachment: false, fromMe: false },
      // "due" is the company's own and its send moved the company's read marker past "uno"
      unread: 1,
    });
    expect(previews.get(empty.match.id)).toEqual({ lastMessage: null, unread: 0 });
    expect(await loadChatPreviews(company.id, [])).toEqual(new Map());
  });
});
