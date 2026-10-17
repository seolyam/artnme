import postgres from "postgres";

/**
 * Adds the staff-workflow schema: payment ledger, order activity log and job
 * assignment. Safe to run repeatedly.
 *
 *   pnpm dlx dotenv-cli -e .env.local -- pnpm tsx scripts/add-staff-workflow-tables.ts
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

async function columnExists(tableName: string, columnName: string) {
  const rows = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName}
  `;
  return rows.length > 0;
}

async function run() {
  const migrations: { name: string; up: () => Promise<unknown> }[] = [
    {
      name: "orders.assigned_to",
      up: async () => {
        if (await columnExists("orders", "assigned_to")) {
          console.log("  skip: orders.assigned_to already exists");
          return;
        }
        await sql`ALTER TABLE orders ADD COLUMN assigned_to uuid`;
        console.log("  added orders.assigned_to");
      },
    },
    {
      name: "payments table",
      up: async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS payments (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            amount numeric(10, 2) NOT NULL,
            method text NOT NULL DEFAULT 'Cash',
            reference text,
            note text,
            received_by uuid,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await sql`CREATE INDEX IF NOT EXISTS payments_order_idx ON payments (order_id)`;
        await sql`CREATE INDEX IF NOT EXISTS payments_created_idx ON payments (created_at)`;
        console.log("  ensured payments");
      },
    },
    {
      name: "order_events table",
      up: async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS order_events (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            type text NOT NULL,
            message text NOT NULL,
            actor_id uuid,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await sql`CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events (order_id, created_at)`;
        console.log("  ensured order_events");
      },
    },
    {
      name: "backfill opening payments",
      up: async () => {
        // Deposits recorded before the ledger existed become one opening entry,
        // so the ledger always sums to orders.deposit_amount.
        const rows = await sql`
          INSERT INTO payments (order_id, amount, method, note, received_by, created_at)
          SELECT o.id, o.deposit_amount, 'Other', 'Recorded before payment log', o.created_by,
                 coalesce(o.updated_at, o.created_at)
          FROM orders o
          WHERE o.deposit_amount > 0
            AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id)
          RETURNING id
        `;
        console.log(`  backfilled ${rows.length} opening payment(s)`);
      },
    },
    {
      name: "backfill created events",
      up: async () => {
        const rows = await sql`
          INSERT INTO order_events (order_id, type, message, actor_id, created_at)
          SELECT o.id, 'created',
                 CASE WHEN o.title LIKE 'Web quote%' THEN 'Quote request received from the website'
                      ELSE 'Order created' END,
                 o.created_by, o.created_at
          FROM orders o
          WHERE NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id = o.id)
          RETURNING id
        `;
        console.log(`  backfilled ${rows.length} created event(s)`);
      },
    },
    {
      name: "orders indexes",
      up: async () => {
        await sql`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status) WHERE deleted_at IS NULL`;
        await sql`CREATE INDEX IF NOT EXISTS orders_due_idx ON orders (due_date) WHERE deleted_at IS NULL`;
        console.log("  ensured orders indexes");
      },
    },
  ];

  for (const m of migrations) {
    console.log(`Running: ${m.name}`);
    await m.up();
  }

  console.log("Done.");
  await sql.end();
}

run().catch(async (e) => {
  console.error("Migration failed:", e);
  await sql.end();
  process.exit(1);
});
