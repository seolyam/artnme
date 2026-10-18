"use client";

import { useState } from "react";
import { CustomerMessage } from "@/components/dashboard/customer-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MessageableOrder = {
  orderNumber: number;
  title: string;
  status: string;
  total: number;
  balance: number;
  dueLabel: string | null;
  trackingUrl?: string | null;
};

/** The order page's message templates, with a picker for which order it's about. */
export function CustomerMessagePanel({
  customerName,
  contact,
  messengerLink,
  orders,
}: {
  customerName: string;
  contact: string | null;
  messengerLink: string | null;
  orders: MessageableOrder[];
}) {
  const [selected, setSelected] = useState(orders[0]?.orderNumber ?? 0);
  const order = orders.find((o) => o.orderNumber === selected) ?? orders[0];
  if (!order) {
    return <p className="text-sm text-on-surface-variant">No orders to message about yet.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.length > 1 && (
        <Select value={String(order.orderNumber)} onValueChange={(v) => setSelected(Number(v))}>
          <SelectTrigger className="h-10 w-full rounded-none" aria-label="Which order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orders.map((o) => (
              <SelectItem key={o.orderNumber} value={String(o.orderNumber)}>
                #{String(o.orderNumber).padStart(4, "0")} · {o.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <CustomerMessage
        key={`${order.orderNumber}-${order.status}-${order.balance}`}
        customerName={customerName}
        contact={contact}
        messengerLink={messengerLink}
        orderNumber={order.orderNumber}
        title={order.title}
        status={order.status}
        total={order.total}
        balance={order.balance}
        dueLabel={order.dueLabel}
        trackingUrl={order.trackingUrl ?? null}
      />
    </div>
  );
}
