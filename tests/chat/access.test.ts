import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { loadConversation } from "@/lib/chat/access";
import { createStranger, resetDb, seedMatch } from "../helpers/db";

describe("loadConversation", () => {
  beforeEach(resetDb);

  it("gives each participant their side and the other user", async () => {
    const { match, company, pro } = await seedMatch();
    expect(await loadConversation(match.id, pro.id)).toMatchObject({ side: "professional", otherUserId: company.id });
    expect(await loadConversation(match.id, company.id)).toMatchObject({ side: "company", otherUserId: pro.id });
  });

  it("refuses strangers", async () => {
    const { match } = await seedMatch();
    const stranger = await createStranger();
    expect(await loadConversation(match.id, stranger.id)).toEqual({ error: "Non autorizzato" });
  });

  it("refuses matches that are not mutual", async () => {
    const { match, pro } = await seedMatch({ mutual: false });
    expect(await loadConversation(match.id, pro.id)).toEqual({ error: "Conversazione non disponibile" });
  });

  it("refuses missing or deleted matches", async () => {
    const { match, pro } = await seedMatch();
    await db.delete(matches).where(eq(matches.id, match.id));
    expect(await loadConversation(match.id, pro.id)).toEqual({ error: "Conversazione non trovata" });
    expect(await loadConversation("preview", pro.id)).toEqual({ error: "Conversazione non trovata" });
  });
});
