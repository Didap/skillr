import { afterAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { TEST_DATABASE_URL } from "./test-db-url";

const dbName = new URL(TEST_DATABASE_URL).pathname.slice(1);

describe("database session time zone", () => {
  afterAll(async () => {
    const admin = postgres(TEST_DATABASE_URL, { max: 1 });
    await admin.unsafe(`alter database "${dbName}" set timezone to 'UTC'`);
    await admin.end();
  });

  it("runs every session in UTC even when the database default is another zone", async () => {
    const admin = postgres(TEST_DATABASE_URL, { max: 1 });
    await admin.unsafe(`alter database "${dbName}" set timezone to 'Europe/Rome'`);
    await admin.end();

    // A fresh module means a fresh pool, whose connections start under the Rome default
    vi.resetModules();
    const { db } = await import("@/db");
    try {
      const rows = await db.$client`select current_setting('TimeZone') as tz`;
      expect(rows[0].tz).toBe("UTC");
    } finally {
      await db.$client.end();
    }
  });
});
