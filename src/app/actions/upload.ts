"use server";

import { cloudinary } from "@/lib/cloudinary";
import { requireUser } from "@/lib/auth-guard";

export async function uploadImageAction(formData: FormData) {
  const user = await requireUser();
  if ("error" in user) return { error: user.error };

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "File mancante" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "skillr",
          public_id: `user_${user.id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" }
          ]
        },
        (error, res) => {
          if (error) reject(error);
          else resolve(res as { secure_url: string });
        }
      ).end(buffer);
    });

    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: "Errore durante l'upload dell'immagine" };
  }
}
