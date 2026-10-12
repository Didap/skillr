import { db } from "@/db";
import { skills } from "@/db/schema";

// Server-only: slug -> label map from the skills table, for showing readable skills.
export async function getSkillLabelMap(): Promise<Map<string, string>> {
  const rows = await db.select({ slug: skills.slug, label: skills.label }).from(skills);
  return new Map(rows.map((r) => [r.slug, r.label]));
}
