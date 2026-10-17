"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { peso } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface MoneyPoint {
  date: string;
  booked: number;
  collected: number;
}

const COLLECTED = "var(--chart-collected)";
const BOOKED = "var(--chart-booked)";

function compact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `₱${(n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `₱${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `₱${n}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as MoneyPoint;
  return (
    <div className="border border-outline-variant/60 bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold">{format(parseISO(String(label)), "EEE, MMM d")}</p>
      <p className="flex items-center gap-2">
        <span className="h-2.5 w-2.5" style={{ background: COLLECTED }} />
        <span className="text-on-surface-variant">Collected</span>
        <span className="ml-auto pl-4 font-mono font-semibold tabular-nums">{peso(point.collected)}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="h-0.5 w-2.5" style={{ background: BOOKED }} />
        <span className="text-on-surface-variant">Booked</span>
        <span className="ml-auto pl-4 font-mono font-semibold tabular-nums">{peso(point.booked)}</span>
      </p>
    </div>
  );
}

/**
 * Cash collected (columns, from the payments ledger) against orders booked
 * (line, by order date) on one peso axis. They differ on purpose: booked is
 * work taken on, collected is money actually received.
 */
export function RevenueChart({ data, height = 200 }: { data: MoneyPoint[]; height?: number }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const collected = data.reduce((s, d) => s + d.collected, 0);
  const booked = data.reduce((s, d) => s + d.booked, 0);
  const hasData = data.some((d) => d.collected !== 0 || d.booked !== 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="spec flex items-center gap-1.5 text-[10px] text-on-surface-variant">
              <span className="h-2.5 w-2.5" style={{ background: COLLECTED }} aria-hidden />
              Collected · cash in
            </p>
            <p className="font-headline text-2xl font-bold tracking-tight">{peso(collected, false)}</p>
          </div>
          <div>
            <p className="spec flex items-center gap-1.5 text-[10px] text-on-surface-variant">
              <span className="h-0.5 w-3" style={{ background: BOOKED }} aria-hidden />
              Booked · orders taken
            </p>
            <p className="font-headline text-2xl font-bold tracking-tight text-on-surface-variant">{peso(booked, false)}</p>
          </div>
        </div>
        <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="Show as">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "spec min-h-8 px-2.5 text-[10px]",
                view === v ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center" style={{ minHeight: height }}>
          <p className="text-sm text-on-surface-variant">No orders or payments in this period yet.</p>
        </div>
      ) : view === "chart" ? (
        <div className="w-full min-w-0" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height }}>
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                tick={{ fontSize: 10, fill: "var(--color-on-surface-variant)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-grid)" }}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={compact}
                tick={{ fontSize: 10, fill: "var(--color-on-surface-variant)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} />} cursor={{ fill: "var(--chart-grid)", opacity: 0.5 }} />
              <Bar dataKey="collected" name="Collected" fill={COLLECTED} maxBarSize={24} radius={[4, 4, 0, 0]} />
              <Line
                dataKey="booked"
                name="Booked"
                type="monotone"
                stroke={BOOKED}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 4, stroke: "var(--color-surface-container-low)", strokeWidth: 2, fill: BOOKED }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto border border-outline-variant/30">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-container-low">
              <tr className="spec text-[10px] text-on-surface-variant">
                <th className="px-3 py-2 text-left font-normal">Day</th>
                <th className="px-3 py-2 text-right font-normal">Collected</th>
                <th className="px-3 py-2 text-right font-normal">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/25">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5">{format(parseISO(d.date), "EEE, MMM d")}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">{peso(d.collected)}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-on-surface-variant">{peso(d.booked)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
