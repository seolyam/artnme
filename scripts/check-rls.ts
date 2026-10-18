import postgres from "postgres";

/**
 * Fails (exit 1) if any table in the public schema has Row Level Security
 * off. The app talks to Postgres as the owner, so RLS with no policies is the
 * intended state: it locks out the public anon key that ships to browsers.
 *
 *   pnpm db:check-rls
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, connect_timeout: 10 });

async function run() {
  const tables = await sql<{ name: string; rls: boolean; policies: number }[]>`
    SELECT c.relname AS name,
           c.relrowsecurity AS rls,
           (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid)::int AS policies
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    ORDER BY c.relname
  `;

  const width = Math.max(5, ...tables.map((t) => t.name.length));
  console.log(`${"table".padEnd(width)}  rls  policies`);
  for (const t of tables) {
    console.log(`${t.name.padEnd(width)}  ${t.rls ? "on " : "OFF"}  ${t.policies}`);
  }

  const off = tables.filter((t) => !t.rls);
  const withPolicies = tables.filter((t) => t.policies > 0);

  if (withPolicies.length > 0) {
    console.warn(
      `\nNote: ${withPolicies.map((t) => t.name).join(", ")} ${withPolicies.length === 1 ? "has" : "have"} policies. ` +
        "The app doesn't need any; make sure none of them grant the anon role access.",
    );
  }

  if (off.length > 0) {
    console.error(
      `\nFAIL: RLS is off on ${off.map((t) => t.name).join(", ")}. Anyone with the public anon key can read and write ${off.length === 1 ? "it" : "them"}.\n` +
        `Fix: ${off.map((t) => `ALTER TABLE public.${t.name} ENABLE ROW LEVEL SECURITY;`).join(" ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`\nOK: RLS is on for all ${tables.length} public tables.`);
  }
}

run()
  .catch((e) => {
    console.error("RLS check failed to run:", e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
