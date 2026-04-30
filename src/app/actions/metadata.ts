"use server";

import { db } from "@/db";

export async function getMetadataCatalog() {
  try {
    const allClusters = await db.query.clusters.findMany({
      with: {
        skills: true
      }
    });
    return { success: true, data: allClusters };
  } catch (error) {
    console.error("Error fetching metadata catalog:", error);
    return { error: "Errore nel caricamento del catalogo." };
  }
}
