import { db } from "@/db";
import { clusters, skills, jobCategories, jobTitles } from "@/db/schema";
import { asc, eq, ilike, or } from "drizzle-orm";

export async function getSkillClusters() {
  return await db.query.clusters.findMany({
    orderBy: [asc(clusters.label)],
  });
}

export async function getSkills(query?: string, clusterId?: string) {
  const where = [];
  
  if (query) {
    where.push(ilike(skills.label, `%${query}%`));
  }
  
  if (clusterId) {
    where.push(eq(skills.clusterId, clusterId));
  }

  return await db.query.skills.findMany({
    where: where.length > 0 ? (where.length > 1 ? or(...where) : where[0]) : undefined,
    orderBy: [asc(skills.label)],
    with: {
      cluster: true,
    },
  });
}

export async function getJobCategories() {
  return await db.query.jobCategories.findMany({
    orderBy: [asc(jobCategories.label)],
  });
}

export async function getJobTitles(categoryId?: string) {
  return await db.query.jobTitles.findMany({
    where: categoryId ? eq(jobTitles.categoryId, categoryId) : undefined,
    orderBy: [asc(jobTitles.label)],
    with: {
      category: true,
    },
  });
}
