import "server-only";

import { and, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { TRASH_RETENTION_DAYS } from "@/lib/order-status";

/**
 * Permanently delete orders that have sat in the trash past the retention
 * window. Items, payments, files and the activity log cascade with them.
 */
export async function purgeExpiredTrash() {
  return db
    .delete(orders)
    .where(
      and(
        isNotNull(orders.deletedAt),
        lt(orders.deletedAt, sql`now() - make_interval(days => ${TRASH_RETENTION_DAYS})`),
      ),
    )
    .returning({ orderNumber: orders.orderNumber });
}
