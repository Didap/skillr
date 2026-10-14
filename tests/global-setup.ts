import { execSync } from "node:child_process";
import postgres from "postgres";
import { TEST_DATABASE_URL } from "./test-db-url";

/**
 * Recreates the test database from scratch and pushes the current schema into it.
 * Refuses to touch anything whose name doesn't end in "_test".
 */
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to run tests against "${dbName}": the test database name must end in _test`);
  }

  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = "/postgres";
  const admin = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`drop database if exists "${dbName}" with (force)`);
    await admin.unsafe(`create database "${dbName}"`);
    // Timestamps are "timestamp without time zone"; drizzle reads them as UTC
    await admin.unsafe(`alter database "${dbName}" set timezone to 'UTC'`);
  } finally {
    await admin.end();
  }

  // drizzle.config.ts loads .env.local with dotenv, which never overrides a variable
  // that is already set, so DATABASE_URL here wins.
  execSync("npx drizzle-kit push --force", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
