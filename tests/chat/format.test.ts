import { describe, expect, it } from "vitest";
import { formatBytes, formatChatTime, formatDayLabel, previewText } from "@/lib/chat/format";

const now = new Date(2026, 9, 14, 15, 30); // local time, 14 Oct 2026

describe("chat formatting", () => {
  it("formats inbox times relative to now", () => {
    expect(formatChatTime(new Date(2026, 9, 14, 9, 5).toISOString(), now)).toBe("09:05");
    expect(formatChatTime(new Date(2026, 9, 13, 22, 0).toISOString(), now)).toBe("Ieri");
    expect(formatChatTime(new Date(2026, 2, 3, 10, 0).toISOString(), now)).toBe("3 mar");
    expect(formatChatTime(new Date(2025, 11, 31, 10, 0).toISOString(), now)).toBe("31/12/25");
  });

  it("labels days in the thread", () => {
    expect(formatDayLabel(new Date(2026, 9, 14, 8), now)).toBe("Oggi");
    expect(formatDayLabel(new Date(2026, 9, 13, 8), now)).toBe("Ieri");
    expect(formatDayLabel(new Date(2026, 9, 5, 8), now)).toBe("lunedì 5 ottobre");
  });

  it("formats sizes and previews", () => {
    expect(formatBytes(800)).toBe("800 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 MB");
    expect(previewText({ body: "Ciao", hasAttachment: false, fromMe: true })).toBe("Tu: Ciao");
    expect(previewText({ body: null, hasAttachment: true, fromMe: false })).toBe("📎 Allegato");
  });
});
