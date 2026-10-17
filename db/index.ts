import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

function createClient(url: string) {
  return postgres(url, {
    prepare: false, // required for Supabase transaction pooler
    // The Supabase pooler drops idle sockets without telling the client, and
    // the next query sent down a dead socket hangs until the statement
    // timeout. Close idle connections ourselves well before that happens,
    // recycle long-lived ones, and fail fast when a new one can't be opened.
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 10,
  });
}

// Dev hot reloads re-evaluate this module; reuse one pool instead of leaking
// a new set of pooler connections on every save.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? createClient(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
