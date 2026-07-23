import postgres from "postgres";

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
      name: "orders.updated_at",
      up: async () => {
        if (await columnExists("orders", "updated_at")) {
          console.log("  skip: orders.updated_at already exists");
          return;
        }
        await sql`ALTER TABLE orders ADD COLUMN updated_at timestamptz`;
        console.log("  added orders.updated_at");
      },
    },
    {
      name: "orders.deleted_at",
      up: async () => {
        if (await columnExists("orders", "deleted_at")) {
          console.log("  skip: orders.deleted_at already exists");
          return;
        }
        await sql`ALTER TABLE orders ADD COLUMN deleted_at timestamptz`;
        console.log("  added orders.deleted_at");
      },
    },
    {
      name: "orders.created_by",
      up: async () => {
        if (await columnExists("orders", "created_by")) {
          console.log("  skip: orders.created_by already exists");
          return;
        }
        await sql`ALTER TABLE orders ADD COLUMN created_by uuid`;
        console.log("  added orders.created_by");
      },
    },
    {
      name: "orders.updated_by",
      up: async () => {
        if (await columnExists("orders", "updated_by")) {
          console.log("  skip: orders.updated_by already exists");
          return;
        }
        await sql`ALTER TABLE orders ADD COLUMN updated_by uuid`;
        console.log("  added orders.updated_by");
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
