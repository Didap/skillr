import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db";

describe("test database", () => {
  it("is reachable and is the throwaway test database", async () => {
    const [row] = await db.execute<{ name: string }>(sql`select current_database() as name`);
    expect(row.name).toMatch(/_test$/);
  });
});
