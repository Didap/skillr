import { beforeEach, describe, expect, it } from "vitest";
import { getMatches } from "@/app/actions/matches";
import { sendMessage } from "@/app/actions/chat";
import { signInAs } from "../helpers/auth";
import { createCompany, createProfessional, resetDb, seedMatch } from "../helpers/db";

describe("getMatches inbox data", () => {
  beforeEach(resetDb);

  it("adds chat previews and puts the latest conversation first", async () => {
    const company = await createCompany();
    const older = await seedMatch({ company, pro: await createProfessional("Luca Rossi"), matchedAt: new Date("2026-01-01T09:00:00Z") });
    const newer = await seedMatch({ company, pro: await createProfessional("Sara Verdi"), matchedAt: new Date("2026-02-01T09:00:00Z") });

    signInAs(company);
    let res = await getMatches();
    if (!res.success) throw new Error(res.error);
    expect(res.data.map((m) => m.id)).toEqual([newer.match.id, older.match.id]);
    expect(res.data[0].chat).toEqual({ lastMessage: null, unread: 0, lastMessageAt: null, blocked: false });

    // A message in the older match brings it to the top
    signInAs(older.pro);
    await sendMessage(older.match.id, { clientId: "c1", body: "Ciao!" });

    signInAs(company);
    res = await getMatches();
    if (!res.success) throw new Error(res.error);
    expect(res.data[0].id).toBe(older.match.id);
    expect(res.data[0].chat).toMatchObject({
      lastMessage: { body: "Ciao!", hasAttachment: false, fromMe: false },
      unread: 1,
      blocked: false,
    });
    expect(typeof res.data[0].chat.lastMessageAt).toBe("string");
  });
});
