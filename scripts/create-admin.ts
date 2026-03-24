import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function main() {
  console.log("Creating admin user directly via SQL...");
  
  try {
    // Check if user already exists
    const existing = await client`SELECT id FROM auth.users WHERE email = 'admin@gmail.com' LIMIT 1`;
    let userId: string;

    if (existing.length > 0) {
      console.log("User already exists. Updating password...");
      userId = existing[0].id;
      await client`
        UPDATE auth.users 
        SET encrypted_password = crypt('admin123', gen_salt('bf')),
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
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          'admin@gmail.com',
          crypt('admin123', gen_salt('bf')),
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
      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === '23505') { 
          console.log("Profile already exists. Updating to admin...");
          await db.update(schema.profiles)
              .set({ role: "admin", fullName: "Admin User" })
              .where(eq(schema.profiles.id, userId));
          console.log("Profile updated.");
      } else {
          console.error("Error inserting profile:", dbError);
      }
    }

    // Insert into auth.identities
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
          json_build_object('sub', ${userId}::text, 'email', 'admin@gmail.com'),
          'email',
          NOW(),
          NOW(),
          NOW()
        )
      `;
      console.log("Auth identity created.");
    }

  } catch (e) {
    console.error("Database error:", e);
  }

  process.exit(0);
}

main();