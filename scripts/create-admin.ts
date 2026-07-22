import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL environment variable.");
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error(
    "Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variable. " +
      "Set both in .env.local before running this script."
  );
  process.exit(1);
}

const DATABASE_URL: string = process.env.DATABASE_URL;
const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD: string = process.env.ADMIN_PASSWORD;

if (ADMIN_PASSWORD.length < 12) {
  if (process.env.ADMIN_ALLOW_WEAK_PASSWORD !== "1") {
    console.error(
      "ADMIN_PASSWORD must be at least 12 characters long. " +
        "Set ADMIN_ALLOW_WEAK_PASSWORD=1 to bypass this check (not recommended)."
    );
    process.exit(1);
  }
  console.warn(
    "WARNING: ADMIN_PASSWORD is shorter than 12 characters and the length check was bypassed."
  );
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log(`Creating admin user (${ADMIN_EMAIL}) directly via SQL...`);

  try {
    const existing = await client`SELECT id FROM auth.users WHERE email = ${ADMIN_EMAIL} LIMIT 1`;
    let userId: string;

    if (existing.length > 0) {
      console.log("User already exists. Updating password...");
      userId = existing[0].id;
      await client`
        UPDATE auth.users 
        SET encrypted_password = crypt(${ADMIN_PASSWORD}, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = ${userId}
      `;
    } else {
      console.log("Inserting new user...");
      const result = await client`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          confirmation_token,
          email_change,
          email_change_token_new,
          recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          ${randomUUID()},
          'authenticated',
          'authenticated',
          ${ADMIN_EMAIL},
          crypt(${ADMIN_PASSWORD}, gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          '{}',
          NOW(),
          NOW(),
          '',
          '',
          '',
          ''
        ) RETURNING id;
      `;
      userId = result[0].id;
    }

    console.log("User in auth.users:", userId);

    try {
      await db.insert(schema.profiles).values({
        id: userId,
        fullName: "Admin User",
        role: "admin",
      });
      console.log("Profile created in database.");
    } catch (dbError: unknown) {
      const errCode =
        dbError && typeof dbError === 'object' &&
        ('code' in dbError ? (dbError as { code?: unknown }).code :
         'cause' in dbError ? ((dbError as { cause?: { code?: unknown } }).cause?.code) :
         undefined);
      if (errCode === '23505') { 
          console.log("Profile already exists. Updating to admin...");
          await db.update(schema.profiles)
              .set({ role: "admin", fullName: "Admin User" })
              .where(eq(schema.profiles.id, userId));
          console.log("Profile updated.");
      } else {
          console.error("Error inserting profile:", dbError);
      }
    }

    const hasIdentity = await client`SELECT id FROM auth.identities WHERE user_id = ${userId} AND provider = 'email'`;
    if (hasIdentity.length === 0) {
      await client`
        INSERT INTO auth.identities (
          id,
          provider_id,
          user_id,
          identity_data,
          provider,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${userId},
          ${userId},
          json_build_object('sub', ${userId}::text, 'email', ${ADMIN_EMAIL}::text),
          'email',
          NOW(),
          NOW(),
          NOW()
        )
      `;
      console.log("Auth identity created.");
    }

    console.log("Admin user ready.");
  } catch (e) {
    console.error("Database error:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();