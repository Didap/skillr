import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, matches } from "@/db/schema";
import { getMessages, sendMessage } from "@/app/actions/chat";
import { publish } from "@/lib/pusher/server";
import { signInAs } from "../helpers/auth";
import { createStranger, insertMessage, resetDb, seedMatch } from "../helpers/db";

const base = Date.UTC(2026, 0, 1, 9, 0, 0);
const at = (seconds: number) => new Date(base + seconds * 1000);

describe("sendMessage", () => {
  beforeEach(resetDb);

  it("stores a trimmed message and echoes the clientId", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    const res = await sendMessage(match.id, { clientId: "c1", body: "  Ciao!  " });
    if ("error" in res) throw new Error(res.error);
    expect(res.data.clientId).toBe("c1");
    expect(res.data.message).toMatchObject({ matchId: match.id, senderId: pro.id, body: "Ciao!", attachment: null });
    expect(await db.select().from(chatMessages)).toHaveLength(1);
  });

  it("rejects empty and whitespace-only messages", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    expect(await sendMessage(match.id, { clientId: "c1", body: "" })).toEqual({ error: "Il messaggio è vuoto" });
    expect(await sendMessage(match.id, { clientId: "c2", body: "  \n\t " })).toEqual({ error: "Il messaggio è vuoto" });
    expect(await sendMessage(match.id, { clientId: "c3" })).toEqual({ error: "Il messaggio è vuoto" });
    expect(await db.select().from(chatMessages)).toHaveLength(0);
  });

  it("rejects messages over 2000 characters", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    expect(await sendMessage(match.id, { clientId: "c1", body: "a".repeat(2001) })).toEqual({ error: "Massimo 2000 caratteri" });
    const ok = await sendMessage(match.id, { clientId: "c2", body: "a".repeat(2000) });
    expect("success" in ok).toBe(true);
  });

  it("rejects signed-out users, strangers and non-mutual matches", async () => {
    const { match } = await seedMatch();
    signInAs(null);
    expect(await sendMessage(match.id, { clientId: "c1", body: "Ciao" })).toEqual({ error: "Non autorizzato" });
    signInAs(await createStranger());
    expect(await sendMessage(match.id, { clientId: "c1", body: "Ciao" })).toEqual({ error: "Non autorizzato" });
    const pending = await seedMatch({ mutual: false });
    signInAs(pending.pro);
    expect(await sendMessage(pending.match.id, { clientId: "c1", body: "Ciao" })).toEqual({ error: "Conversazione non disponibile" });
  });

  it("rejects attachments outside the match folder", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    const res = await sendMessage(match.id, {
      clientId: "c1",
      attachment: { publicId: "helllo/chat/other-match/cv", name: "cv.pdf", mime: "application/pdf", size: 100 },
    });
    expect(res).toEqual({ error: "Allegato non valido" });
  });

  it("stores an attachment-only message", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    const res = await sendMessage(match.id, {
      clientId: "c1",
      attachment: { publicId: `helllo/chat/${match.id}/cv`, name: "cv.pdf", mime: "application/pdf", size: 100 },
    });
    if ("error" in res) throw new Error(res.error);
    expect(res.data.message.body).toBeNull();
    expect(res.data.message.attachment).toMatchObject({ name: "cv.pdf", mime: "application/pdf", size: 100 });
  });

  it("rejects sends on a blocked conversation and stores nothing", async () => {
    const { match, pro, company } = await seedMatch();
    await db.update(matches).set({ blockedById: company.id, blockedAt: new Date() }).where(eq(matches.id, match.id));
    signInAs(pro);
    expect(await sendMessage(match.id, { clientId: "c1", body: "Ciao" })).toEqual({ error: "Questa conversazione è chiusa" });
    expect(await db.select().from(chatMessages)).toHaveLength(0);
  });

  it("rate-limits after 20 messages in 10 seconds", async () => {
    const { match, pro } = await seedMatch();
    for (let i = 0; i < 20; i++) await insertMessage(match.id, pro.id, `m${i}`);
    signInAs(pro);
    expect(await sendMessage(match.id, { clientId: "c1", body: "Ancora" })).toEqual({
      error: "Stai inviando troppi messaggi. Riprova tra qualche secondo.",
    });
  });

  it("updates the match activity and the sender's read marker", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    await sendMessage(match.id, { clientId: "c1", body: "Ciao" });
    const [row] = await db.select().from(matches).where(eq(matches.id, match.id));
    expect(row.lastMessageAt).toBeInstanceOf(Date);
    expect(row.professionalLastReadAt).toBeInstanceOf(Date);
    expect(row.companyLastReadAt).toBeNull();
  });

  it("publishes the message to the thread and an inbox update to both users, skipping the sender's socket only for the thread event", async () => {
    const { match, pro, company } = await seedMatch();
    signInAs(pro);
    const res = await sendMessage(match.id, { clientId: "c1", body: "Ciao", socketId: "123.456" });
    if ("error" in res) throw new Error(res.error);
    expect(publish).toHaveBeenCalledWith(`private-match-${match.id}`, "message:new", res.data.message, "123.456");
    expect(publish).toHaveBeenCalledWith(
      [`private-user-${company.id}`, `private-user-${pro.id}`],
      "inbox:update",
      { matchId: match.id }
    );
  });

  it("ignores a malformed socket id instead of failing the send", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    const res = await sendMessage(match.id, { clientId: "c1", body: "Ciao", socketId: "not-a-socket" });
    expect("success" in res).toBe(true);
    expect(vi.mocked(publish).mock.calls[0][3]).toBeUndefined();
  });
});

describe("getMessages", () => {
  beforeEach(resetDb);

  it("returns the last 50 in chronological order and says older ones exist", async () => {
    const { match, pro } = await seedMatch();
    for (let i = 0; i < 55; i++) await insertMessage(match.id, pro.id, `m${i}`, at(i));
    signInAs(pro);
    const res = await getMessages(match.id);
    if ("error" in res) throw new Error(res.error);
    expect(res.data.messages).toHaveLength(50);
    expect(res.data.messages[0].body).toBe("m5");
    expect(res.data.messages.at(-1)?.body).toBe("m54");
    expect(res.data.hasMore).toBe(true);
  });

  it("pages older messages with before", async () => {
    const { match, pro } = await seedMatch();
    const rows = [];
    for (let i = 0; i < 55; i++) rows.push(await insertMessage(match.id, pro.id, `m${i}`, at(i)));
    signInAs(pro);
    const res = await getMessages(match.id, { before: rows[5].id });
    if ("error" in res) throw new Error(res.error);
    expect(res.data.messages.map((m) => m.body)).toEqual(["m0", "m1", "m2", "m3", "m4"]);
    expect(res.data.hasMore).toBe(false);
  });

  it("after returns only newer messages, oldest first", async () => {
    const { match, pro } = await seedMatch();
    const first = await insertMessage(match.id, pro.id, "uno", at(0));
    await insertMessage(match.id, pro.id, "due", at(1));
    await insertMessage(match.id, pro.id, "tre", at(2));
    signInAs(pro);
    const res = await getMessages(match.id, { after: first.id });
    if ("error" in res) throw new Error(res.error);
    expect(res.data.messages.map((m) => m.body)).toEqual(["due", "tre"]);
  });

  it("ignores a cursor from another match", async () => {
    const a = await seedMatch();
    const b = await seedMatch();
    await insertMessage(a.match.id, a.pro.id, "mine", at(0));
    const foreign = await insertMessage(b.match.id, b.pro.id, "theirs", at(1));
    signInAs(a.pro);
    for (const cursor of [{ after: foreign.id }, { before: foreign.id }]) {
      const res = await getMessages(a.match.id, cursor);
      if ("error" in res) throw new Error(res.error);
      expect(res.data.messages).toEqual([]);
    }
  });

  it("rejects both cursors at once", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    expect(await getMessages(match.id, { before: "a", after: "b" })).toEqual({ error: "Richiesta non valida" });
  });

  it("returns the other side's read marker and the block state", async () => {
    const { match, pro, company } = await seedMatch();
    const readAt = new Date("2026-01-01T10:00:00.000Z");
    await db.update(matches).set({ companyLastReadAt: readAt, blockedById: company.id }).where(eq(matches.id, match.id));
    signInAs(pro);
    const res = await getMessages(match.id);
    if ("error" in res) throw new Error(res.error);
    expect(res.data.otherLastReadAt).toBe(readAt.toISOString());
    expect(res.data.blockedById).toBe(company.id);
  });

  it("refuses strangers", async () => {
    const { match } = await seedMatch();
    signInAs(await createStranger());
    expect(await getMessages(match.id)).toEqual({ error: "Non autorizzato" });
  });
});
