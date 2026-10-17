import { getPricePresets } from "@/app/actions/prices";
import { getMe } from "@/app/actions/staff";
import { PageHeader } from "@/components/dashboard/page-header";
import { PriceList } from "@/components/dashboard/price-list";

export default async function PricesPage() {
  const [presets, me] = await Promise.all([getPricePresets(), getMe()]);
  const isAdmin = me.role === "admin";

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Price list"
        title="Prices"
        description={
          isAdmin
            ? "These show up as one-tap buttons when you add an item to an order. Tarpaulin prices per sq ft work out the price from the size."
            : "The shop's standard prices. They also appear as buttons in the order form. Ask an admin to change them."
        }
      />
      <PriceList presets={presets} isAdmin={isAdmin} />
    </div>
  );
}
