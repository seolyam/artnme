import postgres from "postgres";

/**
 * Schema for staff management, payment voids, order files/proofs, customer
 * tracking links and price presets. Safe to run repeatedly; every new table
 * is created with RLS on (see scripts/check-rls.ts).
 *
 *   pnpm dlx dotenv-cli -e .env.local -- pnpm tsx scripts/add-portal-features-schema.ts
 *
 * Web-quote attachments used to live as "Attachment: <url>" lines inside the
 * item description. They are copied into order_files; the description lines
 * are left alone (the order page hides lines that have a matching file) unless
 * you pass --strip-attachment-lines.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const STRIP = process.argv.includes("--strip-attachment-lines");
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

async function columnExists(tableName: string, columnName: string) {
  const rows = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName} AND column_name = ${columnName}
  `;
  return rows.length > 0;
}

const ATTACHMENT_LINE = /^Attachment:\s*(https?:\/\/\S+)\s*$/;

async function run() {
  const migrations: { name: string; up: () => Promise<unknown> }[] = [
    {
      name: "profiles.deactivated_at",
      up: async () => {
        if (await columnExists("profiles", "deactivated_at")) {
          console.log("  skip: already exists");
          return;
        }
        await sql`ALTER TABLE profiles ADD COLUMN deactivated_at timestamptz`;
        console.log("  added profiles.deactivated_at");
      },
    },
    {
      name: "payments.voids_payment_id",
      up: async () => {
        if (!(await columnExists("payments", "voids_payment_id"))) {
          await sql`ALTER TABLE payments ADD COLUMN voids_payment_id uuid REFERENCES payments(id) ON DELETE CASCADE`;
          console.log("  added payments.voids_payment_id");
        } else {
          console.log("  skip: column already exists");
        }
        // A payment can be voided once: the reversal row is unique per original.
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS payments_voids_unique ON payments (voids_payment_id) WHERE voids_payment_id IS NOT NULL`;
      },
    },
    {
      name: "orders.tracking_token",
      up: async () => {
        if (await columnExists("orders", "tracking_token")) {
          console.log("  skip: already exists");
        } else {
          // Volatile default: every existing row gets its own random token.
          await sql`ALTER TABLE orders ADD COLUMN tracking_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '')`;
          console.log("  added orders.tracking_token");
        }
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_idx ON orders (tracking_token)`;
      },
    },
    {
      name: "order_files table",
      up: async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS order_files (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            kind text NOT NULL DEFAULT 'attachment',
            url text NOT NULL,
            public_id text,
            file_name text,
            mime_type text,
            bytes integer,
            uploaded_by uuid,
            approved_at timestamptz,
            approved_by uuid,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await sql`ALTER TABLE order_files ENABLE ROW LEVEL SECURITY`;
        await sql`CREATE INDEX IF NOT EXISTS order_files_order_idx ON order_files (order_id, created_at)`;
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS order_files_order_url_unique ON order_files (order_id, url)`;
        console.log("  ensured order_files");
      },
    },
    {
      name: "copy web-quote attachments into order_files",
      up: async () => {
        const items = await sql<{ id: string; order_id: string; description: string; created_at: Date }[]>`
          SELECT i.id, i.order_id, i.description, o.created_at
          FROM order_items i JOIN orders o ON o.id = i.order_id
          WHERE i.description LIKE '%Attachment:%'
        `;
        let copied = 0;
        let stripped = 0;
        for (const item of items) {
          const lines = item.description.split("\n");
          for (const line of lines) {
            const m = line.trim().match(ATTACHMENT_LINE);
            if (!m) continue;
            const fileUrl = m[1];
            const fileName = decodeURIComponent(fileUrl.split("/").pop()?.split("?")[0] ?? "") || null;
            const rows = await sql`
              INSERT INTO order_files (order_id, kind, url, file_name, created_at)
              VALUES (${item.order_id}, 'attachment', ${fileUrl}, ${fileName}, ${item.created_at})
              ON CONFLICT (order_id, url) DO NOTHING
              RETURNING id
            `;
            copied += rows.length;
          }
          if (STRIP) {
            const kept = lines.filter((l) => !ATTACHMENT_LINE.test(l.trim()));
            if (kept.length !== lines.length) {
              await sql`UPDATE order_items SET description = ${kept.join("\n") || null} WHERE id = ${item.id}`;
              stripped++;
            }
          }
        }
        console.log(`  copied ${copied} attachment(s) from ${items.length} item(s)${STRIP ? `, stripped lines from ${stripped}` : ""}`);
      },
    },
    {
      name: "price_presets table",
      up: async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS price_presets (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            product_type product_type NOT NULL,
            label text NOT NULL,
            unit text NOT NULL DEFAULT 'piece',
            price numeric(10, 2) NOT NULL,
            sort_order integer NOT NULL DEFAULT 0,
            archived_at timestamptz,
            created_by uuid,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await sql`ALTER TABLE price_presets ENABLE ROW LEVEL SECURITY`;
        await sql`CREATE INDEX IF NOT EXISTS price_presets_product_idx ON price_presets (product_type, sort_order)`;
        console.log("  ensured price_presets");
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
