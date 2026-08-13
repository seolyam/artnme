import postgres from "postgres";

const url = process.env.DATABASE_URL!;
const sql = postgres(url, { prepare: false });

async function tableExists(name: string) {
  const rows = await sql`
    SELECT to_regclass(${`public.${name}`}) AS exists
  `;
  return rows[0]?.exists !== null;
}

async function columnExists(tableName: string, columnName: string) {
  const rows = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName}
  `;
  return rows.length > 0;
}

async function sequenceExists(name: string) {
  const rows = await sql`
    SELECT to_regclass(${`public.${name}`}) AS exists
  `;
  return rows[0]?.exists !== null;
}

async function indexExists(name: string) {
  const rows = await sql`
    SELECT to_regclass(${`public.${name}`}) AS exists
  `;
  return rows[0]?.exists !== null;
}

async function run() {
  // 1. Create sequence if it doesn't exist.
  const seqExists = await sequenceExists("order_number_seq");
  if (seqExists) {
    console.log("  sequence order_number_seq already exists — skipping creation");
  } else {
    // Start the sequence at a high number so order numbers look professional
    // and don't collide with casual references (e.g. "order #42").
    const startFrom = 1000;
    await sql.unsafe(
      `CREATE SEQUENCE order_number_seq START WITH ${startFrom} INCREMENT BY 1 NO CYCLE`,
    );
    console.log(`  created sequence order_number_seq (starting at ${startFrom})`);
  }

  // 2. Add the column if missing.
  const colExists = await columnExists("orders", "order_number");
  if (colExists) {
    console.log("  column orders.order_number already exists — skipping add");
  } else {
    await sql`ALTER TABLE orders ADD COLUMN order_number integer`;
    console.log("  added column orders.order_number");
  }

  // 3. Backfill NULL values from the sequence (stable, deterministic order
  //    by created_at so older orders get smaller numbers).
  const nullRows = await sql`
    SELECT id FROM orders WHERE order_number IS NULL ORDER BY created_at ASC
  `;
  if (nullRows.length > 0) {
    console.log(`  backfilling ${nullRows.length} order(s) with sequence values`);
    for (const row of nullRows) {
      await sql`UPDATE orders SET order_number = nextval('order_number_seq') WHERE id = ${row.id} AND order_number IS NULL`;
    }
    console.log("  backfill complete");
  } else {
    console.log("  no NULL order_number values to backfill");
  }

  // 4. Set the column NOT NULL with a default pulling from the sequence.
  const colInfo = await sql`
    SELECT is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number'
  `;
  const isNullable = colInfo[0]?.is_nullable === "YES";
  const hasDefault = colInfo[0]?.column_default !== null;

  if (isNullable) {
    await sql`ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL`;
    console.log("  set orders.order_number NOT NULL");
  } else {
    console.log("  orders.order_number already NOT NULL");
  }

  if (!hasDefault) {
    await sql`ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT nextval('order_number_seq')`;
    console.log("  set default nextval('order_number_seq')");
  } else {
    console.log("  default already set");
  }

  // 5. Attach the sequence to the column so DROP COLUMN cleans up.
  try {
    await sql`ALTER SEQUENCE order_number_seq OWNED BY orders.order_number`;
    console.log("  sequence owned by orders.order_number");
  } catch {
    // Already owned — ignore.
  }

  // 6. Unique index for lookups by order number.
  const idxExists = await indexExists("orders_order_number_unique");
  if (idxExists) {
    console.log("  unique index orders_order_number_unique already exists");
  } else {
    await sql`CREATE UNIQUE INDEX orders_order_number_unique ON orders (order_number)`;
    console.log("  created unique index orders_order_number_unique");
  }

  console.log("\nDone. Orders now have clean sequential numbers.");
  await sql.end();
}

run().catch(async (e) => {
  console.error("Migration failed:", e);
  await sql.end();
  process.exit(1);
});