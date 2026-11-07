import postgres from "postgres";

/**
 * Adds the nullable customers.email column used to email customers their
 * order tracking link. Safe to run repeatedly (ADD COLUMN IF NOT EXISTS).
 *
 *   pnpm dlx dotenv-cli -e .env.local -- pnpm tsx scripts/add-customer-email.ts
 *
 * Run this BEFORE deploying the code that reads customers.email, or customer
 * and order queries will fail with "column does not exist".
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

async function run() {
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text`;
  console.log("customers.email: ok");
}

run()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
