import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { chatReports, matches } from "@/db/schema";
import { blockConversation, reportConversation, sendMessage, unblockConversation } from "@/app/actions/chat";
import { buildReportEmail } from "@/lib/chat/report-email";
import { sendEmail, sendInBackground } from "@/lib/mail";
import { publish } from "@/lib/pusher/server";
import { signInAs } from "../helpers/auth";
import { insertMessage, resetDb, seedMatch } from "../helpers/db";

describe("block", () => {
  beforeEach(resetDb);

  it("closes the conversation for both sides and only the blocker can reopen it", async () => {
    const { match, pro, company } = await seedMatch();
    signInAs(company);
    expect(await blockConversation(match.id)).toEqual({ success: true, data: { blockedById: company.id } });
    expect(publish).toHaveBeenCalledWith(`private-match-${match.id}`, "conversation:blocked", { blockedById: company.id });

    signInAs(pro);
    expect(await sendMessage(match.id, { clientId: "c1", body: "Ciao" })).toEqual({ error: "Questa conversazione è chiusa" });
    expect(await unblockConversation(match.id)).toEqual({ error: "Solo chi ha bloccato la conversazione può sbloccarla" });

    signInAs(company);
    expect(await unblockConversation(match.id)).toEqual({ success: true, data: { blockedById: null } });
    expect(publish).toHaveBeenCalledWith(`private-match-${match.id}`, "conversation:unblocked", {});
    signInAs(pro);
    expect("success" in (await sendMessage(match.id, { clientId: "c2", body: "Ciao" }))).toBe(true);
  });

  it("does not announce an unblock that did not happen (the block moved to the other side mid-call)", async () => {
    const { match, pro, company } = await seedMatch();
    signInAs(company);
    await blockConversation(match.id);
    vi.mocked(publish).mockClear();

    // Between loadConversation and the guarded UPDATE the block passes to the professional
    const realUpdate = db.update.bind(db);
    vi.spyOn(db, "update").mockImplementationOnce(((table: typeof matches) => ({
      set: (values: Record<string, unknown>) => ({
        where: (condition: unknown) => ({
          returning: async (fields: Record<string, never>) => {
            await realUpdate(matches).set({ blockedById: pro.id }).where(eq(matches.id, match.id));
            return realUpdate(table).set(values).where(condition as never).returning(fields);
          },
        }),
      }),
    })) as never);

    expect(await unblockConversation(match.id)).toEqual({ success: true, data: { blockedById: pro.id } });
    expect(publish).not.toHaveBeenCalledWith(expect.anything(), "conversation:unblocked", expect.anything());
    vi.restoreAllMocks();
  });

  it("keeps the first blocker when both sides block", async () => {
    const { match, pro, company } = await seedMatch();
    signInAs(company);
    await blockConversation(match.id);
    signInAs(pro);
    expect(await blockConversation(match.id)).toEqual({ success: true, data: { blockedById: company.id } });
  });
});

describe("report", () => {
  beforeEach(resetDb);
  afterEach(() => vi.unstubAllEnvs());

  it("stores the report and emails moderation with the recent transcript", async () => {
    vi.stubEnv("CHAT_MODERATION_EMAIL", "mod@helllo.test");
    const { match, pro, company } = await seedMatch();
    const bad = await insertMessage(match.id, pro.id, "Mandami 100 euro");
    signInAs(company);
    const res = await reportConversation(match.id, { reason: "scam", details: "Chiede soldi", messageId: bad.id });
    if ("error" in res) throw new Error(res.error);
    expect(res.data.blockedById).toBeNull();

    const [report] = await db.select().from(chatReports);
    expect(report).toMatchObject({ matchId: match.id, reporterId: company.id, messageId: bad.id, reason: "scam", details: "Chiede soldi" });

    const [, sends] = vi.mocked(sendInBackground).mock.calls[0];
    await sends[0]();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "mod@helllo.test", text: expect.stringContaining("Mandami 100 euro") })
    );
  });

  it("can block in the same step", async () => {
    const { match, company } = await seedMatch();
    signInAs(company);
    const res = await reportConversation(match.id, { reason: "harassment", block: true });
    expect(res).toMatchObject({ success: true, data: { blockedById: company.id } });
  });

  it("rejects a message from another conversation", async () => {
    const a = await seedMatch();
    const b = await seedMatch();
    const foreign = await insertMessage(b.match.id, b.pro.id, "altro");
    signInAs(a.company);
    expect(await reportConversation(a.match.id, { reason: "spam", messageId: foreign.id })).toEqual({ error: "Messaggio non trovato" });
  });

  it("still stores the report when no moderation address is configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { match, company } = await seedMatch();
    signInAs(company);
    expect("success" in (await reportConversation(match.id, { reason: "other" }))).toBe(true);
    expect(sendInBackground).not.toHaveBeenCalled();
    expect(await db.select().from(chatReports)).toHaveLength(1);
  });

  it("rejects unknown reasons", async () => {
    const { match, company } = await seedMatch();
    signInAs(company);
    // @ts-expect-error: invalid on purpose
    expect(await reportConversation(match.id, { reason: "boh" })).toEqual({ error: "Segnalazione non valida" });
  });
});

describe("buildReportEmail", () => {
  it("escapes user content in the HTML version", () => {
    const email = buildReportEmail({
      reportId: "r1", matchId: "m1", reason: "spam", details: "<script>x</script>",
      reporter: { id: "u1", email: "a@b.c", role: "company" },
      reportedMessageId: null,
      transcript: [{ senderRole: "professional", createdAt: "2026-01-01T10:00:00.000Z", text: "<b>ciao</b>" }],
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;b&gt;ciao&lt;/b&gt;");
    expect(email.text).toContain("<b>ciao</b>");
    expect(email.subject).toBe("Segnalazione chat: spam");
  });
});
