import Link from "next/link";
import { Copy } from "lucide-react";
import { getCustomers } from "@/app/actions/customers";
import { getOrder } from "@/app/actions/orders";
import { getPricePresets } from "@/app/actions/prices";
import { CreateOrderForm, type CreateOrderDefaults } from "@/components/forms/create-order-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { isWebQuote } from "@/lib/order-status";
import { toNumber } from "@/lib/money";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; from?: string }>;
}) {
  const sp = await searchParams;
  const [customers, presets, source] = await Promise.all([
    getCustomers(),
    getPricePresets(),
    typeof sp.from === "string" ? getOrder(sp.from) : Promise.resolve(null),
  ]);

  // "Order again": copy the items (and customer) of an earlier order. The due
  // date and payments start fresh.
  const defaults: CreateOrderDefaults | undefined = source
    ? {
        title: isWebQuote(source.title) ? "" : source.title,
        items: source.items.map((it) => ({
          productType: it.productType,
          description: (it.description ?? "")
            .split("\n")
            .filter((l) => !/^(Contact|Needed by|Attachment|Source):/.test(l))
            .join("\n"),
          quantity: it.quantity,
          dimensions: it.dimensions ?? "",
          unitPrice: toNumber(it.unitPrice),
        })),
      }
    : undefined;
  const preselectCustomerId = source?.customerId ?? (typeof sp.customer === "string" ? sp.customer : undefined);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        back={{ href: "/dashboard/orders", label: "Orders board" }}
        eyebrow={source ? `Order again · from #${String(source.orderNumber).padStart(4, "0")}` : "New order"}
        title="Take an order"
        description="Four quick steps. Only the customer and one item are required; everything else can be filled in later."
      />

      <CreateOrderForm
        customers={customers.map((c) => ({ id: c.id, name: c.name, contactNumber: c.contactNumber }))}
        preselectCustomerId={preselectCustomerId}
        defaults={defaults}
        presets={presets}
        notice={
          source ? (
            <p className="flex items-start gap-3 border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
              <span>
                Copied the items from{" "}
                <Link href={`/dashboard/orders/${source.orderNumber}`} className="font-semibold underline-offset-2 hover:underline">
                  order #{source.orderNumber}
                </Link>
                . Check the prices and pick a new due date.
              </span>
            </p>
          ) : undefined
        }
      />
    </div>
  );
}
