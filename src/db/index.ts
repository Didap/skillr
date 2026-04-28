import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For edge environments, you might use different drivers, 
// but for our Dockerized Postgres, postgres-js is excellent.
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
