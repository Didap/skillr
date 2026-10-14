import { describe, expect, it } from "vitest";
import { parseChannel, matchChannel, userChannel } from "@/lib/chat/channels";
import { chatFolder, isInMatchFolder, signedAttachmentUrl } from "@/lib/chat/attachments";
import { toChatMessage } from "@/lib/chat/messages";

describe("channels", () => {
  it("round-trips match and user channel names", () => {
    expect(parseChannel(matchChannel("m1"))).toEqual({ kind: "match", id: "m1" });
    expect(parseChannel(userChannel("u1"))).toEqual({ kind: "user", id: "u1" });
  });

  it("rejects anything else", () => {
    expect(parseChannel("presence-match-m1")).toBeNull();
    expect(parseChannel("private-admin-x")).toBeNull();
    expect(parseChannel("private-match-")).toBeNull();
  });
});

describe("attachments", () => {
  it("only accepts public ids inside the match folder", () => {
    expect(chatFolder("m1")).toBe("helllo/chat/m1");
    expect(isInMatchFolder("helllo/chat/m1/abc", "m1")).toBe(true);
    expect(isInMatchFolder("helllo/chat/m2/abc", "m1")).toBe(false);
    expect(isInMatchFolder("helllo/chat/m1x/abc", "m1")).toBe(false);
    expect(isInMatchFolder("helllo/chat/m1/../m2/abc", "m1")).toBe(false);
    expect(isInMatchFolder("helllo/chat/m1", "m1")).toBe(false);
  });

  it("signs authenticated delivery URLs with the file format", () => {
    const url = signedAttachmentUrl("helllo/chat/m1/abc", "application/pdf");
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/test-cloud\/image\/authenticated\/s--[\w-]+--\/.*helllo\/chat\/m1\/abc\.pdf$/);
    expect(signedAttachmentUrl("helllo/chat/m1/abc", "image/png")).toMatch(/abc\.png$/);
  });
});

describe("toChatMessage", () => {
  const base = {
    id: "msg1", matchId: "m1", senderId: "u1", body: "Ciao",
    attachmentPublicId: null, attachmentName: null, attachmentMime: null, attachmentSize: null,
    createdAt: new Date("2026-10-14T10:00:00.000Z"),
  };

  it("maps a text message", () => {
    expect(toChatMessage(base)).toEqual({
      id: "msg1", matchId: "m1", senderId: "u1", body: "Ciao", attachment: null, createdAt: "2026-10-14T10:00:00.000Z",
    });
  });

  it("maps an attachment with a signed URL", () => {
    const message = toChatMessage({
      ...base, body: null, attachmentPublicId: "helllo/chat/m1/cv", attachmentName: "cv.pdf",
      attachmentMime: "application/pdf", attachmentSize: 1234,
    });
    expect(message.attachment).toMatchObject({ name: "cv.pdf", mime: "application/pdf", size: 1234 });
    expect(message.attachment?.url).toContain("/image/authenticated/");
  });
});
