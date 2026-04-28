"use server";

import { cloudinary } from "@/lib/cloudinary";
import { auth } from "@/auth";

export async function uploadImageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "File mancante" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "skillr",
          public_id: `user_${session.user.id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return { success: true, url: (result as any).secure_url };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { error: "Errore durante l'upload dell'immagine" };
  }
}
