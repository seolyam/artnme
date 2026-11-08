import type { OrderFormValues } from "@/lib/validators";
import { roundMoney, toNumber } from "@/lib/money";
import { toShopInputValue } from "@/lib/time";

// "Apply items" on a web quote: the drafted items go through the normal
// updateOrder validation. Only the items change; a total staff already typed
// is never overwritten, and the customer's own words stay on the order.

export type ApplyTarget = {
  customerId: string;
  title: string;
  status: OrderFormValues["status"];
  totalAmount: string | number;
  depositAmount: string | number;
  dueDate: Date | string | null;
  items: { description: string | null }[];
};

type DraftFormItem = Omit<OrderFormValues["items"][number], "id">;

export function buildApplyPayload(order: ApplyTarget, items: DraftFormItem[], draftDue?: string): OrderFormValues {
  const currentTotal = toNumber(order.totalAmount);
  const itemsTotal = roundMoney(items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0));
  const request = order.items
    .map((it) => (it.description ?? "").trim())
    .filter(Boolean)
    .join("\n");

  return {
    customerId: order.customerId,
    title: order.title,
    status: order.status,
    totalAmount: currentTotal > 0 ? currentTotal : itemsTotal,
    depositAmount: toNumber(order.depositAmount),
    dueDate: order.dueDate ? toShopInputValue(order.dueDate) : (draftDue ?? ""),
    items: items.map((it, i) =>
      i === 0 && request
        ? { ...it, description: [it.description, `From the request:\n${request}`].filter(Boolean).join("\n\n") }
        : { ...it },
    ),
  };
}
