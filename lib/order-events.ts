import { db } from "@/db";
import { orderEvents, type OrderEventType } from "@/db/schema";
import { sql } from "drizzle-orm";

type Executor = Pick<typeof db, "insert">;

/**
 * Append to an order's timeline. Pass the transaction when called inside one
 * so the event commits (or rolls back) with the change it describes.
 */
export async function logOrderEvent(
  exec: Executor,
  event: {
    orderId: string;
    type: OrderEventType;
    message: string;
    actorId?: string | null;
  },
) {
  await exec.insert(orderEvents).values({
    orderId: event.orderId,
    type: event.type,
    message: event.message,
    actorId: event.actorId ?? null,
    // now() is fixed for the whole transaction, so events written together
    // would tie; clock_timestamp() keeps them in the order they happened.
    createdAt: sql`clock_timestamp()`,
  });
}
