import { cloudinary } from "@/lib/cloudinary";

const FORMAT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export const chatFolder = (matchId: string) => `helllo/chat/${matchId}`;

/** sendMessage only accepts files uploaded for this conversation. */
export function isInMatchFolder(publicId: string, matchId: string) {
  const prefix = `${chatFolder(matchId)}/`;
  return publicId.startsWith(prefix) && publicId.length > prefix.length && !publicId.includes("..");
}

/**
 * Attachments are "authenticated" Cloudinary resources: the plain URL returns 401, only
 * URLs signed with our API secret are served. Generated server-side for participants only.
 */
export function signedAttachmentUrl(publicId: string, mime: string) {
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: "image",
    sign_url: true,
    secure: true,
    analytics: false, // no ?_a= tracking query: the signed URL ends with the file name
    format: FORMAT_BY_MIME[mime],
  });
}
