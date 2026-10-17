import postgres from "postgres";
import { normalizeContact } from "../lib/phone";

/**
 * Rewrites existing customers' phone numbers into the canonical form the app
 * now saves (09XXXXXXXXX; emails lowercased). Dry run by default: it prints
 * what would change and touches nothing until you pass --apply.
 *
 *   pnpm dlx dotenv-cli -e .env.local -- pnpm tsx scripts/normalize-customer-phones.ts [--apply]
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const sql = postgres(url, { prepare: false, max: 1 });

async function run() {
  const rows = await sql<{ id: string; name: string; contact_number: string }[]>`
    SELECT id, name, contact_number FROM customers WHERE contact_number IS NOT NULL ORDER BY created_at
  `;

  const changes = rows
    .map((r) => ({ ...r, next: normalizeContact(r.contact_number) }))
    .filter((r) => r.next !== r.contact_number);

  // Two records that normalize to the same number are probably one person.
  const byNumber = new Map<string, string[]>();
  for (const r of rows) {
    const key = normalizeContact(r.contact_number);
    if (!key) continue;
    byNumber.set(key, [...(byNumber.get(key) ?? []), r.name]);
  }
  const dupes = [...byNumber].filter(([, names]) => names.length > 1);

  console.log(`${rows.length} customers with a contact; ${changes.length} would change.`);
  for (const c of changes) console.log(`  ${c.name}: "${c.contact_number}" → "${c.next}"`);
  if (dupes.length > 0) {
    console.log("\nSame number on more than one customer (merge by hand if they're the same person):");
    for (const [num, names] of dupes) console.log(`  ${num}: ${names.join(", ")}`);
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to save these changes.");
  } else {
    await sql.begin(async (t) => {
      // postgres.js's TransactionSql type drops the tagged-template call signature.
      const tx = t as unknown as typeof sql;
      for (const c of changes) {
        await tx`UPDATE customers SET contact_number = ${c.next || null} WHERE id = ${c.id}`;
      }
    });
    console.log(`\nUpdated ${changes.length} customer(s).`);
  }
  await sql.end();
}

run().catch(async (e) => {
  console.error("Failed:", e);
  await sql.end();
  process.exit(1);
});
