import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { cloudinary } from "@/lib/cloudinary";
import { uploadChatAttachment } from "@/app/actions/chat";
import { signInAs } from "../helpers/auth";
import { createStranger, resetDb, seedMatch } from "../helpers/db";

function form(file: File) {
  const data = new FormData();
  data.append("file", file);
  return data;
}

describe("uploadChatAttachment", () => {
  beforeEach(async () => {
    await resetDb();
    vi.restoreAllMocks();
  });

  it("uploads to the match folder as an authenticated resource", async () => {
    const upload = vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(((options: { folder: string }, callback: (e: unknown, r: unknown) => void) => ({
      end: () => callback(undefined, { public_id: `${options.folder}/abc123` }),
    })) as never);
    const { match, pro } = await seedMatch();
    signInAs(pro);

    const res = await uploadChatAttachment(match.id, form(new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" })));
    expect(res).toEqual({
      success: true,
      data: { publicId: `helllo/chat/${match.id}/abc123`, name: "cv.pdf", mime: "application/pdf", size: 8 },
    });
    expect(upload.mock.calls[0][0]).toMatchObject({ folder: `helllo/chat/${match.id}`, type: "authenticated", resource_type: "image" });
  });

  it("rejects unsupported types and files over 5 MB", async () => {
    const { match, pro } = await seedMatch();
    signInAs(pro);
    expect(await uploadChatAttachment(match.id, form(new File(["x"], "a.exe", { type: "application/x-msdownload" })))).toEqual({
      error: "Formato non supportato. Invia un'immagine (JPG, PNG, WebP, GIF) o un PDF.",
    });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    expect(await uploadChatAttachment(match.id, form(big))).toEqual({ error: "File troppo grande. Massimo 5MB." });
    expect(await uploadChatAttachment(match.id, new FormData())).toEqual({ error: "File mancante" });
  });

  it("refuses strangers and closed conversations", async () => {
    const { match, company } = await seedMatch();
    const file = new File(["x"], "a.png", { type: "image/png" });
    signInAs(await createStranger());
    expect(await uploadChatAttachment(match.id, form(file))).toEqual({ error: "Non autorizzato" });
    await db.update(matches).set({ blockedById: company.id }).where(eq(matches.id, match.id));
    signInAs(company);
    expect(await uploadChatAttachment(match.id, form(file))).toEqual({ error: "Questa conversazione è chiusa" });
  });

  it("reports Cloudinary failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation(((_: unknown, callback: (e: unknown) => void) => ({
      end: () => callback(new Error("boom")),
    })) as never);
    const { match, pro } = await seedMatch();
    signInAs(pro);
    expect(await uploadChatAttachment(match.id, form(new File(["x"], "a.png", { type: "image/png" })))).toEqual({
      error: "Errore durante il caricamento del file",
    });
  });
});
