import type { ChatReportReason } from "./types";

export type ReportEmailInput = {
  reportId: string;
  matchId: string;
  reason: ChatReportReason;
  details: string | null;
  reporter: { id: string; email: string | null | undefined; role: string | null };
  reportedMessageId: string | null;
  transcript: { senderRole: "professional" | "company"; createdAt: string; text: string }[];
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain moderation email: there is no admin UI, so it carries the recent transcript. */
export function buildReportEmail(input: ReportEmailInput) {
  const lines = [
    `Segnalazione ${input.reportId}`,
    `Match: ${input.matchId}`,
    `Motivo: ${input.reason}`,
    `Dettagli: ${input.details ?? "—"}`,
    `Segnalato da: ${input.reporter.email ?? "—"} (${input.reporter.role ?? "—"}, ${input.reporter.id})`,
    `Messaggio segnalato: ${input.reportedMessageId ?? "intera conversazione"}`,
    "",
    "Ultimi messaggi (dal più vecchio):",
    ...input.transcript.map((m) => `[${m.createdAt}] ${m.senderRole}: ${m.text}`),
  ];
  const text = lines.join("\n");
  return {
    subject: `Segnalazione chat: ${input.reason}`,
    text,
    html: `<pre style="font-family:monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  };
}
