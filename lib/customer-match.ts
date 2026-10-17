import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { normalizeContact } from "@/lib/phone";

type Reader = Pick<typeof db, "select">;

/**
 * The customer whose phone/email matches `contact` however either was typed
 * (0917…, +63 917…, 917-…). Older rows may not be normalized yet, so match on
 * the last ten digits in SQL and confirm with normalizeContact().
 */
export async function findCustomerByContact(exec: Reader, contact: string | null | undefined) {
  const key = normalizeContact(contact);
  if (!key) return undefined;

  if (key.includes("@")) {
    const [row] = await exec
      .select()
      .from(customers)
      .where(sql`lower(trim(${customers.contactNumber})) = ${key}`)
      .limit(1);
    return row;
  }

  const digits = key.replace(/\D/g, "");
  if (digits.length < 7) {
    const [row] = await exec.select().from(customers).where(eq(customers.contactNumber, key)).limit(1);
    return row;
  }

  const tail = digits.slice(-10);
  const candidates = await exec
    .select()
    .from(customers)
    .where(sql`regexp_replace(coalesce(${customers.contactNumber}, ''), '\D', '', 'g') LIKE ${`%${tail}`}`)
    .orderBy(customers.createdAt)
    .limit(20);
  return candidates.find((c) => normalizeContact(c.contactNumber) === key);
}
