import postgres from "postgres";

/**
 * Adds the "Sewing" order status (between Printing and Ready for Pickup) and
 * the jersey upper / jersey set / polo / chinese collar / button pins product
 * types. Safe to run repeatedly (ADD VALUE IF NOT EXISTS).
 *
 *   pnpm dlx dotenv-cli -e .env.local -- pnpm tsx scripts/add-sewing-and-products-enum.ts
 *
 * Run this BEFORE deploying the code that uses the new values, or inserts with
 * them will fail with "invalid input value for enum".
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

const NEW_PRODUCTS = ["Jersey Upper", "Jersey Set", "Polo", "Chinese Collar", "Button Pins"];

async function run() {
  await sql`ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'Sewing' AFTER 'Printing'`;
  console.log("order_status: Sewing");

  for (const product of NEW_PRODUCTS) {
    await sql.unsafe(`ALTER TYPE product_type ADD VALUE IF NOT EXISTS '${product}' BEFORE 'Other'`);
    console.log(`product_type: ${product}`);
  }
}

run()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
