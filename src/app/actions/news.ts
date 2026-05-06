"use server";

import { db } from "@/db";
import { paPosts } from "@/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export async function getPaNewsAction(category?: "bandi" | "tecnico" | "case-study") {
  try {
    const query = db
      .select()
      .from(paPosts)
      .where(isNotNull(paPosts.publishedAt))
      .orderBy(desc(paPosts.publishedAt));

    // Nota: in Drizzle v45+ la gestione dinamica dei where è cambiata, 
    // ma qui usiamo una query semplice. Se category è presente, filtriamo.
    const allPosts = await query;
    
    if (category) {
      return { success: true, posts: allPosts.filter(p => p.category === category) };
    }

    return { success: true, posts: allPosts };
  } catch (error) {
    console.error("Error fetching PA news:", error);
    return { success: false, error: "Impossibile caricare le news." };
  }
}

export async function getPaPostBySlugAction(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(paPosts)
      .where(eq(paPosts.slug, slug))
      .limit(1);

    if (!post) {
      return { success: false, error: "Articolo non trovato." };
    }

    return { success: true, post };
  } catch (error) {
    console.error("Error fetching PA post:", error);
    return { success: false, error: "Errore nel caricamento dell'articolo." };
  }
}
