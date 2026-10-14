import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatReports, matches } from "@/db/schema";
import { insertMessage, resetDb, seedMatch } from "../helpers/db";

describe("chat schema", () => {
  beforeEach(resetDb);

  it("stores a text message", async () => {
    const { match, pro } = await seedMatch();
    const message = await insertMessage(match.id, pro.id, "Ciao!");
    expect(message.body).toBe("Ciao!");
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a message with neither body nor attachment", async () => {
    const { match, pro } = await seedMatch();
    await expect(db.insert(chatMessages).values({ matchId: match.id, senderId: pro.id })).rejects.toThrow();
  });

  it("deletes messages and reports together with their match", async () => {
    const { match, pro } = await seedMatch();
    await insertMessage(match.id, pro.id, "Ciao!");
    await db.insert(chatReports).values({ matchId: match.id, reporterId: pro.id, reason: "spam" });
    await db.delete(matches).where(eq(matches.id, match.id));
    expect(await db.select().from(chatMessages)).toHaveLength(0);
    expect(await db.select().from(chatReports)).toHaveLength(0);
  });

  it("starts matches unread, unblocked and without activity", async () => {
    const { match } = await seedMatch();
    expect(match.professionalLastReadAt).toBeNull();
    expect(match.companyLastReadAt).toBeNull();
    expect(match.lastMessageAt).toBeNull();
    expect(match.blockedById).toBeNull();
  });
});
