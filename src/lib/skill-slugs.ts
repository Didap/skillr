// Skills are stored as slugs everywhere (profiles, jobs, discovery overlap query).
// Pure helpers, safe to import from client components.

// Same shape as the catalog slugs: "Agile & Scrum" -> "agile-scrum", "Next.js" -> "nextjs".
// "+" and "#" are kept so C, C++ and C# don't collapse into the same slug.
export function slugifySkill(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9+#]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Label for a slug: the catalog label when there is one, otherwise a readable version of the slug.
export function skillLabel(slug: string, labelBySlug: Map<string, string>): string {
  const label = labelBySlug.get(slug);
  if (label) return label;
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

// Turns a mix of slugs, catalog labels and free text into unique slugs.
export function normalizeSkills(
  values: string[],
  catalog: { slug: string; label: string }[]
): string[] {
  const slugs = new Set(catalog.map((s) => s.slug));
  const slugByLabel = new Map(catalog.map((s) => [s.label.toLowerCase(), s.slug]));
  const result: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const slug = slugs.has(value)
      ? value
      : slugByLabel.get(value.toLowerCase()) ?? slugifySkill(value);
    if (slug && !result.includes(slug)) result.push(slug);
  }
  return result;
}
