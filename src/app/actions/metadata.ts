"use server";

import { db } from "@/db";
import { clusters, skills } from "@/db/schema";
import { eq } from "drizzle-orm";

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
