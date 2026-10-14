import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For edge environments, you might use different drivers, 
// but for our Dockerized Postgres, postgres-js is excellent.
// Pin the session to UTC: timestamp columns are "without time zone", written with DB now()
// and read back by drizzle as UTC, so a server default of another zone would shift them.
const client = postgres(connectionString, { connection: { TimeZone: "UTC" } });
export const db = drizzle(client, { schema });
