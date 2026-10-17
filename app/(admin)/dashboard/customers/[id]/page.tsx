import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  History,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Phone,
  Plus,
  StickyNote,
} from "lucide-react";
import { getCustomerById, getCustomerNotes } from "@/app/actions/customers";
import { getMe } from "@/app/actions/staff";
import { PageHeader, PrimaryLink } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { StatusChip } from "@/components/dashboard/status-chip";
import { CustomerDialog } from "@/components/dashboard/customer-dialog";
import { CopyButton } from "@/components/dashboard/copy-button";
import { RecordDepositDialog } from "@/components/dashboard/record-deposit-dialog";
import { CustomerMessagePanel } from "@/components/dashboard/customer-message-panel";
import { balanceOf, peso, roundMoney, toNumber } from "@/lib/money";
import { dialable, formatContact, isPhMobile } from "@/lib/phone";
import { formatShopDate, formatShopTime, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, notes, me] = await Promise.all([getCustomerById(id), getCustomerNotes(id), getMe()]);

  if (!customer) {
    notFound();
  }

  const allOrders = customer.orders;
  const now = new Date();
  const totalSpent = roundMoney(allOrders.reduce((sum, o) => sum + toNumber(o.totalAmount), 0));
  const totalPaid = roundMoney(allOrders.reduce((sum, o) => sum + toNumber(o.depositAmount), 0));
  const outstanding = roundMoney(allOrders.reduce((sum, o) => sum + Math.max(0, balanceOf(o)), 0));
  const activeOrders = allOrders.filter((o) => o.status !== "Completed");
  const pastOrders = allOrders.filter((o) => o.status === "Completed");
  const overdueCount = activeOrders.filter((o) => o.dueDate && new Date(o.dueDate) < now).length;
  const first = customer.name.split(/\s+/)[0];
  const contact = customer.contactNumber;
  const isEmail = !!contact && contact.includes("@");

  // Message templates default to the order most likely to need a message:
  // open jobs first, then anything with money still owed.
  const messageable = [...activeOrders, ...pastOrders.filter((o) => balanceOf(o) > 0.009), ...pastOrders]
    .filter((o, i, list) => list.findIndex((x) => x.id === o.id) === i)
    .slice(0, 12)
    .map((o) => ({
      orderNumber: o.orderNumber,
      title: o.title,
      status: o.status,
      total: toNumber(o.totalAmount),
      balance: Math.max(0, balanceOf(o)),
      dueLabel: o.dueDate
        ? `${formatShopDate(o.dueDate, { weekday: "short", month: "short", day: "numeric" })}, ${formatShopTime(o.dueDate)}`
        : null,
    }));

  const action =
    "inline-flex min-h-11 items-center gap-2 border border-outline-variant/60 bg-surface-container-lowest px-4 text-sm font-semibold transition-colors hover:border-on-surface-variant";

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        back={{ href: "/dashboard/customers", label: "Customers" }}
        eyebrow={`Customer since ${formatShopDate(customer.createdAt, { month: "long", year: "numeric" })}`}
        title={customer.name}
        actions={
          <>
            <CustomerDialog
              customer={{ ...customer, orderCount: allOrders.length }}
              isAdmin={me.role === "admin"}
              trigger={
                <button type="button" className={cn(action, "min-h-12")}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              }
            />
            <PrimaryLink href={`/dashboard/orders/new?customer=${customer.id}`}>
              <Plus className="h-4 w-4" />
              New order for {first}
            </PrimaryLink>
          </>
        }
      />

      {/* Contact */}
      <div className="flex flex-wrap gap-2">
        {contact && !isEmail && (
          <>
            <a href={`tel:${dialable(contact)}`} className={action}>
              <Phone className="h-4 w-4" />
              Call {formatContact(contact)}
            </a>
            {isPhMobile(contact) && (
              <a href={`sms:${dialable(contact)}`} className={action}>
                <MessageSquareText className="h-4 w-4" />
                Text
              </a>
            )}
            <CopyButton value={formatContact(contact)} label="Copy number" toastMessage="Number copied" className={action} />
          </>
        )}
        {contact && isEmail && (
          <a href={`mailto:${contact}`} className={action}>
            <MessageSquareText className="h-4 w-4" />
            Email {contact}
          </a>
        )}
        {customer.fbMessengerLink && (
          <a href={customer.fbMessengerLink} target="_blank" rel="noopener noreferrer" className={action}>
            <MessageCircle className="h-4 w-4" />
            Messenger
          </a>
        )}
        {!contact && !customer.fbMessengerLink && (
          <p className="flex items-center gap-2 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            <AlertTriangle className="h-4 w-4" />
            No phone or Messenger on file. Press Edit to add one.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-0.5 border-2 border-surface-container-high bg-surface-container-high lg:grid-cols-4">
        <Stat label="Orders" value={String(allOrders.length)} sub={`${pastOrders.length} completed`} />
        <Stat
          label="Active jobs"
          value={String(activeOrders.length)}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : "On schedule"}
          alert={overdueCount > 0}
        />
        <Stat label="Total ordered" value={peso(totalSpent, false)} sub={`${peso(totalPaid, false)} paid`} />
        <Stat
          label="Still owes"
          value={outstanding > 0.009 ? peso(outstanding) : "Nothing"}
          sub={outstanding > 0.009 ? "Across all orders" : "All paid up"}
          alert={outstanding > 0.009}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel icon={Banknote} title={`Active orders · ${activeOrders.length}`}>
            {activeOrders.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-outline-variant/50 px-4 py-6">
                <p className="text-sm text-on-surface-variant">Nothing in progress for {first}.</p>
                <Link
                  href={`/dashboard/orders/new?customer=${customer.id}`}
                  className="text-sm font-semibold text-accent-ink underline-offset-2 hover:underline"
                >
                  Take a new order →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
                {activeOrders.map((o) => (
                  <OrderRow key={o.id} order={o} now={now} showPayment />
                ))}
              </ul>
            )}
          </Panel>

          <Panel icon={History} title={`Past orders · ${pastOrders.length}`}>
            {pastOrders.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No completed orders yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
                {pastOrders.map((o) => (
                  <OrderRow key={o.id} order={o} now={now} showPayment />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel icon={MessageSquareText} title={`Message ${first}`}>
            <CustomerMessagePanel
              customerName={customer.name}
              contact={customer.contactNumber}
              messengerLink={customer.fbMessengerLink}
              orders={messageable}
            />
          </Panel>

          <Panel icon={StickyNote} title="Latest notes">
            {notes.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No notes yet. Notes added on any of {first}&apos;s orders show up here.
              </p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="border-l-2 border-[#f2b33d] bg-surface-container-lowest px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm">{n.message}</p>
                    <p className="mt-1 text-xs text-on-surface-variant" suppressHydrationWarning>
                      <Link href={`/dashboard/orders/${n.orderNumber}`} className="font-semibold hover:text-on-surface">
                        #{String(n.orderNumber).padStart(4, "0")}
                      </Link>{" "}
                      · {n.actorName ?? "Staff"} · {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

type CustomerOrder = NonNullable<Awaited<ReturnType<typeof getCustomerById>>>["orders"][number];

function OrderRow({ order, now, showPayment }: { order: CustomerOrder; now: Date; showPayment?: boolean }) {
  const balance = balanceOf(order);
  const overdue = !!order.dueDate && new Date(order.dueDate) < now && order.status !== "Completed";

  return (
    <li className="relative flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface-container-lowest px-4 py-3">
      {overdue && <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-brand" />}
      <Link href={`/dashboard/orders/${order.orderNumber}`} className="group min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="spec text-[11px] text-on-surface-variant">#{String(order.orderNumber).padStart(4, "0")}</span>
          <span className="truncate text-sm font-semibold group-hover:text-accent-ink">{order.title}</span>
          <StatusChip status={order.status} />
          {overdue && (
            <span className="spec bg-brand px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-white">Overdue</span>
          )}
        </span>
        <span className="mt-1 block text-xs text-on-surface-variant">
          Ordered {formatShopDate(order.createdAt, { month: "short", day: "numeric", year: "numeric" })}
          {order.dueDate && ` · Due ${formatShopDate(order.dueDate)}`}
          {` · ${order.items.length} item${order.items.length === 1 ? "" : "s"}`}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-right font-mono text-sm tabular-nums">
          <div className="font-semibold">{toNumber(order.totalAmount) > 0 ? peso(order.totalAmount) : "To quote"}</div>
          {balance > 0.009 && <div className="text-xs text-accent-ink">{peso(balance)} owed</div>}
        </div>
        {showPayment && balance > 0.009 && (
          <RecordDepositDialog
            orderId={order.id}
            orderNumber={order.orderNumber}
            currentDeposit={order.depositAmount}
            totalAmount={order.totalAmount}
            orderTitle={order.title}
            trigger={
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1.5 bg-on-surface px-3 text-xs font-semibold text-surface"
              >
                <Banknote className="h-3.5 w-3.5" />
                Record payment
              </button>
            }
          />
        )}
        <ChevronRight className="hidden h-4 w-4 text-on-surface-variant sm:block" />
      </div>
    </li>
  );
}

function Stat({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) {
  return (
    <div className="relative flex flex-col gap-2 bg-surface-container-low p-4 md:p-5">
      {alert && <span className="absolute left-0 right-0 top-0 h-[3px] bg-brand" />}
      <p className={cn("spec text-[11px]", alert ? "text-accent-ink" : "text-on-surface-variant")}>{label}</p>
      <p className={cn("font-headline text-2xl font-bold leading-none tracking-[-0.04em] md:text-3xl", alert && "text-accent-ink")}>
        {value}
      </p>
      <p className="text-xs text-on-surface-variant">{sub}</p>
    </div>
  );
}
