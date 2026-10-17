import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, getOrderActivity } from "@/app/actions/orders";
import { getMe, getStaff } from "@/app/actions/staff";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  History,
  MessageSquareText,
  Package,
  Phone,
  ReceiptText,
  UserRound,
  Users,
} from "lucide-react";
import { OrderActions } from "@/components/dashboard/order-actions";
import { Panel } from "@/components/dashboard/panel";
import { dialable, formatContact } from "@/lib/phone";
import { RecordDepositDialog } from "@/components/dashboard/record-deposit-dialog";
import { SettleDialog } from "@/components/dashboard/settle-dialog";
import { AssigneeSelect } from "@/components/dashboard/assignee-select";
import { OrderTimeline } from "@/components/dashboard/order-timeline";
import { CustomerMessage } from "@/components/dashboard/customer-message";
import { isWebQuote, statusStyle } from "@/lib/order-status";
import { balanceOf, peso, toNumber } from "@/lib/money";
import { daysUntil, formatShopDate, formatShopTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrder(orderNumber);

  if (!order) {
    notFound();
  }

  const [activity, staff, me] = await Promise.all([
    getOrderActivity(order.id),
    getStaff(),
    getMe(),
  ]);

  const total = toNumber(order.totalAmount);
  const paid = toNumber(order.depositAmount);
  const balance = balanceOf(order);
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const done = order.status === "Completed";
  const dueIn = order.dueDate ? daysUntil(order.dueDate) : null;
  const isOverdue = !!order.dueDate && new Date(order.dueDate) < new Date() && !done;
  const s = statusStyle(order.status);
  const web = isWebQuote(order.title);
  const itemsTotal = order.items.reduce(
    (sum, it) => sum + it.quantity * toNumber(it.unitPrice),
    0,
  );

  const dueLabel = order.dueDate
    ? `${formatShopDate(order.dueDate, { weekday: "short", month: "short", day: "numeric" })}, ${formatShopTime(order.dueDate)}`
    : null;

  return (
    <div className="max-w-6xl space-y-6">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="spec inline-flex items-center gap-1.5 text-[11px] text-on-surface-variant hover:text-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Orders board
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="spec bg-surface-container-high px-2 py-1 text-[11px] text-on-surface-variant">
                #{String(order.orderNumber).padStart(4, "0")}
              </span>
              <span
                className={cn(
                  "spec inline-flex items-center gap-1.5 px-2 py-1 text-[10px] tracking-[0.1em]",
                  s.text,
                  s.soft,
                )}
              >
                <span className={cn("h-1.5 w-1.5", s.dot)} />
                {order.status}
              </span>
              {web && (
                <span className="spec border border-brand/60 px-2 py-1 text-[10px] tracking-[0.08em] text-accent-ink">
                  Web quote
                </span>
              )}
              {isOverdue && (
                <span className="spec inline-flex items-center gap-1 bg-brand px-2 py-1 text-[10px] tracking-[0.08em] text-white">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
            <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em] md:text-4xl">
              {order.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!done && balance > 0.009 && (
              <RecordDepositDialog
                orderId={order.id}
                currentDeposit={order.depositAmount}
                totalAmount={order.totalAmount}
                orderTitle={order.title}
                orderNumber={order.orderNumber}
              />
            )}
            {order.status === "Ready for Pickup" && (
              <SettleDialog orderId={order.id} orderNumber={order.orderNumber} balance={balance} />
            )}
            <OrderActions
              orderId={order.id}
              orderNumber={order.orderNumber}
              currentStatus={order.status}
              balance={balance}
              isAdmin={me.role === "admin"}
            />
          </div>
        </div>

        {/* Pipeline */}
        <StatusPipeline status={order.status} />
      </header>

      {!done && total <= 0 && order.status !== "Pending" && (
        <div className="flex items-center gap-3 border border-brand/50 bg-brand/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent-ink" />
          <span>
            This job is in production but has no price yet.{" "}
            <Link href={`/dashboard/orders/${order.orderNumber}/edit`} className="font-semibold underline">
              Add item prices
            </Link>{" "}
            before it&apos;s released.
          </span>
        </div>
      )}

      {/* Grid order is Items → side panels → Activity so phones see money
          and contact info before the full log; on desktop the side panels
          move to the right column. */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel icon={Package} title={`Items · ${order.items.length}`}>
            {order.items.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No items.</p>
            ) : (
              <div className="divide-y divide-outline-variant/30 border border-outline-variant/30">
                {order.items.map((item) => {
                  const line = item.quantity * toNumber(item.unitPrice);
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 bg-surface-container-lowest p-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="spec border border-outline-variant/60 px-1.5 py-0.5 text-[10px]">
                            {item.productType}
                          </span>
                          <span className="font-mono text-sm font-semibold">×{item.quantity}</span>
                          {item.dimensions && (
                            <span className="text-xs text-on-surface-variant">{item.dimensions}</span>
                          )}
                        </div>
                        {item.description && (
                          <Description text={item.description} />
                        )}
                      </div>
                      <div className="shrink-0 text-right font-mono text-sm tabular-nums">
                        <div className="font-semibold">{line > 0 ? peso(line) : "—"}</div>
                        {item.quantity > 1 && toNumber(item.unitPrice) > 0 && (
                          <div className="text-xs text-on-surface-variant">{peso(item.unitPrice)} ea</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {Math.abs(itemsTotal - total) > 0.009 && (
              <p className="mt-3 text-xs text-accent-ink">
                Items add up to {peso(itemsTotal)} but the order total is {peso(total)}.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <Panel icon={Users} title="Job">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="spec mb-1 text-[10px] text-on-surface-variant">Customer</dt>
                <dd>
                  <Link
                    href={`/dashboard/customers/${order.customer.id}`}
                    className="font-semibold hover:text-accent-ink"
                  >
                    {order.customer.name}
                  </Link>
                  {order.customer.contactNumber && (
                    <a
                      href={
                        order.customer.contactNumber.includes("@")
                          ? `mailto:${order.customer.contactNumber}`
                          : `tel:${dialable(order.customer.contactNumber)}`
                      }
                      className="mt-1 flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {formatContact(order.customer.contactNumber)}
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="spec mb-1 text-[10px] text-on-surface-variant">Due</dt>
                <dd className={cn("flex items-center gap-1.5", isOverdue && "font-semibold text-accent-ink")}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  {dueLabel ? (
                    <>
                      {dueLabel}
                      {!done && dueIn !== null && (
                        <span className="text-xs text-on-surface-variant">
                          ·{" "}
                          {dueIn < 0
                            ? `${-dueIn}d late`
                            : dueIn === 0
                              ? "today"
                              : dueIn === 1
                                ? "tomorrow"
                                : `in ${dueIn}d`}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-on-surface-variant">No due date</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="spec mb-1.5 flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                  <UserRound className="h-3 w-3" />
                  Assigned to
                </dt>
                <dd>
                  <AssigneeSelect
                    orderId={order.id}
                    assignedTo={order.assignedTo}
                    staff={staff}
                    meId={me.id}
                  />
                </dd>
              </div>
              <div>
                <dt className="spec mb-1 text-[10px] text-on-surface-variant">Opened</dt>
                <dd className="text-on-surface-variant">
                  {formatShopDate(order.createdAt, { month: "long", day: "numeric", year: "numeric" })}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel icon={ReceiptText} title="Payments">
            <div className="space-y-2 text-sm">
              <Row label="Total" value={total > 0 ? peso(total) : "Not priced"} />
              <Row label="Paid" value={peso(paid)} />
              <div className="h-1.5 bg-surface-container-high" aria-hidden>
                <div className="h-full bg-success" style={{ width: `${paidPct}%` }} />
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-semibold">Balance</span>
                <span
                  className={cn(
                    "font-headline text-2xl font-bold tabular-nums",
                    balance > 0.009 ? "text-accent-ink" : "text-success",
                  )}
                >
                  {balance > 0.009 ? peso(balance) : "Paid"}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-outline-variant/30 pt-3">
              <p className="spec mb-2 text-[10px] text-on-surface-variant">Ledger</p>
              {activity.payments.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {activity.payments.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {p.method}
                          {p.reference && (
                            <span className="ml-1 font-mono font-normal text-on-surface-variant">#{p.reference}</span>
                          )}
                        </p>
                        <p className="text-on-surface-variant">
                          {formatShopDate(p.createdAt)} {formatShopTime(p.createdAt)}
                          {p.receivedByName ? ` · ${p.receivedByName}` : ""}
                        </p>
                        {p.note && <p className="text-on-surface-variant/80">{p.note}</p>}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono font-semibold tabular-nums",
                          toNumber(p.amount) < 0 && "text-accent-ink",
                        )}
                      >
                        {toNumber(p.amount) < 0 ? "−" : ""}
                        {peso(Math.abs(toNumber(p.amount)))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel icon={MessageSquareText} title="Message customer">
            <CustomerMessage
              key={`${order.status}-${balance}`}
              customerName={order.customer.name}
              contact={order.customer.contactNumber}
              messengerLink={order.customer.fbMessengerLink}
              orderNumber={order.orderNumber}
              title={order.title}
              status={order.status}
              total={total}
              balance={Math.max(0, balance)}
              dueLabel={dueLabel}
            />
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel icon={History} title="Activity & notes">
            <OrderTimeline orderId={order.id} events={activity.events} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

const PIPELINE = ["Pending", "Designing", "Printing", "Ready for Pickup", "Completed"];

function StatusPipeline({ status }: { status: string }) {
  const current = PIPELINE.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-0.5" aria-label="Order progress">
      {PIPELINE.map((step, i) => {
        const reached = i <= current;
        const st = statusStyle(step);
        return (
          <li key={step} aria-current={i === current ? "step" : undefined} className="space-y-1.5">
            <div className={cn("h-1", reached ? st.dot : "bg-surface-container-high")} />
            <p
              className={cn(
                "spec truncate text-[9px] sm:text-[10px]",
                i === current ? "text-on-surface" : "text-on-surface-variant/70",
              )}
            >
              {st.short}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-mono font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Web-quote descriptions embed "Attachment: <url>" lines — make them clickable. */
function Description({ text }: { text: string }) {
  return (
    <div className="space-y-0.5 text-sm text-on-surface-variant">
      {text.split("\n").map((line, i) => {
        const m = line.match(/^Attachment:\s*(https?:\/\/\S+)$/);
        if (m) {
          return (
            <p key={i}>
              Attachment:{" "}
              <a href={m[1]} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-ink underline">
                open file
              </a>
            </p>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}
