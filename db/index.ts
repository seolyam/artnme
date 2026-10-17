import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// `max_pipeline` is a real postgres.js option that its type definitions omit.
type ClientOptions = postgres.Options<Record<string, never>> & { max_pipeline?: number };

function createClient(url: string) {
  const options: ClientOptions = {
    prepare: false, // required for Supabase transaction pooler
    // The Supabase pooler drops idle sockets without telling the client, and
    // the next query sent down a dead socket hangs until the statement
    // timeout. Close idle connections ourselves well before that happens,
    // recycle long-lived ones, and fail fast when a new one can't be opened.
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 10,
    // No pipelining. postgres.js sends the next query down a connection
    // before the previous one's ReadyForQuery arrives; the transaction pooler
    // hands the backend back at that boundary, so the follow-up messages land
    // on a different backend. The first one sits in ClientRead until the
    // statement timeout and the request never finishes. One statement at a
    // time per connection avoids the race entirely.
    max_pipeline: 0,
  };
  return postgres(url, options);
}

// Dev hot reloads re-evaluate this module; reuse one pool instead of leaking
// a new set of pooler connections on every save.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };
const client = globalForDb.pgClient ?? createClient(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
