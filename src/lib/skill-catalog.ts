import { db } from "@/db";
import { skills } from "@/db/schema";

type SkillRow = { slug: string; label: string };

// The catalog is seed data that practically never changes, yet it was read in full on every
// feed load and detail page. Keep it in memory for a few minutes per server instance.
const TTL_MS = 10 * 60_000;
let cached: { rows: Promise<SkillRow[]>; at: number } | null = null;

/** Server-only: every catalog skill (slug + label). */
export function getSkillCatalog(): Promise<SkillRow[]> {
  if (!cached || Date.now() - cached.at > TTL_MS) {
    const rows = db.select({ slug: skills.slug, label: skills.label }).from(skills);
    cached = { rows, at: Date.now() };
    // Don't keep a failed query around
    rows.catch(() => { cached = null; });
  }
  return cached.rows;
}

/** Server-only: slug -> label map, for showing readable skills. */
export async function getSkillLabelMap(): Promise<Map<string, string>> {
  const rows = await getSkillCatalog();
  return new Map(rows.map((r) => [r.slug, r.label]));
}
