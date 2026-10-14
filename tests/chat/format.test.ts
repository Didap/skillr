import { describe, expect, it } from "vitest";
import { formatBytes, formatChatTime, formatDayLabel, formatMessageTime, isSameRomeDay, previewText } from "@/lib/chat/format";

// Every input is an explicit UTC instant; expectations are Europe/Rome wall-clock, so the
// suite passes whatever TZ the runner uses. 14 Oct 2026 is CEST (UTC+2).
const utc = (iso: string) => new Date(iso);
const now = utc("2026-10-14T13:30:00Z"); // 15:30 in Rome

describe("chat formatting (Europe/Rome)", () => {
  it("formats inbox times relative to now", () => {
    expect(formatChatTime("2026-10-14T07:05:00Z", now)).toBe("09:05");
    expect(formatChatTime("2026-10-13T20:00:00Z", now)).toBe("Ieri"); // 22:00 on the 13th in Rome
    expect(formatChatTime("2026-03-03T09:00:00Z", now)).toBe("3 mar");
    expect(formatChatTime("2025-12-31T10:00:00Z", now)).toBe("31/12/25");
  });

  it("uses the Rome calendar day when it differs from the UTC day", () => {
    // 22:30Z on the 13th is 00:30 on the 14th in Rome
    expect(formatChatTime("2026-10-13T22:30:00Z", now)).toBe("00:30");
    expect(formatDayLabel(utc("2026-10-13T22:30:00Z"), now)).toBe("Oggi");
    // now is 00:30 on the 15th in Rome; 21:00Z on the 14th (23:00 Rome) is yesterday
    const lateNow = utc("2026-10-14T22:30:00Z");
    expect(formatChatTime("2026-10-14T21:00:00Z", lateNow)).toBe("Ieri");
    expect(formatDayLabel(utc("2026-10-14T21:00:00Z"), lateNow)).toBe("Ieri");
  });

  it("labels days in the thread", () => {
    expect(formatDayLabel(utc("2026-10-14T06:00:00Z"), now)).toBe("Oggi");
    expect(formatDayLabel(utc("2026-10-13T06:00:00Z"), now)).toBe("Ieri");
    expect(formatDayLabel(utc("2026-10-05T06:00:00Z"), now)).toBe("lunedì 5 ottobre");
    expect(formatDayLabel(utc("2025-10-05T06:00:00Z"), now)).toBe("domenica 5 ottobre 2025");
  });

  it("formats message time in Rome", () => {
    expect(formatMessageTime("2026-10-14T07:05:00Z")).toBe("09:05");
    expect(formatMessageTime("2026-01-14T07:05:00Z")).toBe("08:05"); // CET
  });

  it("compares Rome calendar days", () => {
    expect(isSameRomeDay("2026-10-13T22:30:00Z", "2026-10-14T10:00:00Z")).toBe(true);
    expect(isSameRomeDay("2026-10-13T21:30:00Z", "2026-10-13T22:30:00Z")).toBe(false);
  });

  it("formats sizes and previews", () => {
    expect(formatBytes(800)).toBe("800 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
    expect(previewText({ body: "Ciao", hasAttachment: false, fromMe: true })).toBe("Tu: Ciao");
    expect(previewText({ body: null, hasAttachment: true, fromMe: false })).toBe("📎 Allegato");
  });
});
