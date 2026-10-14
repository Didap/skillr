import { sql } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, companyProfiles, matches, professionalProfiles, users } from "@/db/schema";

export type TestUser = { id: string; role: "professional" | "company" };

export async function resetDb() {
  await db.execute(sql`truncate table "user" cascade`);
}

async function createUser(role: TestUser["role"], name: string): Promise<TestUser> {
  const [user] = await db
    .insert(users)
    .values({ email: `${crypto.randomUUID()}@test.local`, role, name })
    .returning({ id: users.id });
  if (role === "company") {
    await db.insert(companyProfiles).values({ userId: user.id, companyName: name });
  } else {
    const [firstName, lastName = ""] = name.split(" ");
    await db.insert(professionalProfiles).values({ userId: user.id, firstName, lastName, title: "Designer" });
  }
  return { id: user.id, role };
}

export const createCompany = (name = "Acme Srl") => createUser("company", name);
export const createProfessional = (name = "Luca Rossi") => createUser("professional", name);
export const createStranger = () => createUser("professional", "Marta Bianchi");

/** A swipe match between a company and a professional, mutual unless told otherwise. */
export async function seedMatch(opts: { mutual?: boolean; company?: TestUser; pro?: TestUser; matchedAt?: Date } = {}) {
  const company = opts.company ?? (await createCompany());
  const pro = opts.pro ?? (await createProfessional());
  const mutual = opts.mutual ?? true;
  const [match] = await db
    .insert(matches)
    .values({
      professionalId: pro.id,
      companyId: company.id,
      professionalStatus: "liked",
      companyStatus: mutual ? "liked" : "pending",
      matchedAt: mutual ? (opts.matchedAt ?? new Date()) : null,
    })
    .returning();
  return { company, pro, match };
}

export async function insertMessage(matchId: string, senderId: string, body: string, createdAt?: Date) {
  const [message] = await db
    .insert(chatMessages)
    .values({ matchId, senderId, body, ...(createdAt ? { createdAt } : {}) })
    .returning();
  return message;
}
