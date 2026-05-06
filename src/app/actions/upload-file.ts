"use server";

import { cloudinary } from "@/lib/cloudinary";
import { auth } from "@/auth";

/**
 * Uploads any file to Cloudinary (PDF, Image, etc.)
 * Suitable for CVs and Portfolios.
 */
export async function uploadFileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Non autorizzato" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "File mancante" };
  }

  // Basic validation
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  
  if (!isPdf && !isImage) {
    return { error: "Formato non supportato. Carica un PDF o un'immagine." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "File troppo grande. Massimo 5MB." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "skillr/documents",
          public_id: `doc_${session.user.id}_${Date.now()}`,
          resource_type: "auto", // Automatically detect file type (pdf, image, etc.)
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
    return { error: "Errore durante l'upload del file" };
  }
}
