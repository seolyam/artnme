"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

interface RevenuePoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.length > 0;
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const peak = data.reduce(
    (best, d) => (d.revenue > best.revenue ? d : best),
    { date: "", revenue: 0 } as RevenuePoint,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
            style={{ fontFamily: "var(--font-label)" }}
          >
            30-Day Revenue
          </p>
          <p
            className="text-2xl font-bold tracking-tight tabular-nums"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            ₱{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        {hasData && peak.revenue > 0 && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Peak Day
            </p>
            <p className="text-sm font-bold tabular-nums">
              ₱{peak.revenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {format(parseISO(peak.date), "MMM d")}
            </p>
          </div>
        )}
      </div>

      {hasData ? (
        <div className="h-[180px] w-full min-w-0">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={180}
          >
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary-container, #E31E24)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary-container, #E31E24)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-outline-variant, #e5e7eb)"
                vertical={false}
                opacity={0.4}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v), "MMM d")}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #6b7280)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(v) =>
                  v >= 1000 ? `₱${Math.round(v / 1000)}k` : `₱${Math.round(v)}`
                }
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #6b7280)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-container-highest, #fff)",
                  border: "1px solid var(--color-outline-variant, #e5e7eb)",
                  borderRadius: 4,
                  fontSize: 12,
                }}
                labelFormatter={(v) =>
                  format(parseISO(String(v)), "EEEE, MMM d, yyyy")
                }
                formatter={(value) => {
                  const n = Number(value) || 0;
                  return [
                    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    "Revenue",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary-container, #E31E24)"
                strokeWidth={2}
                fill="url(#revGradient)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[180px] flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            No revenue in the last 30 days.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Orders will appear here as they come in.
          </p>
        </div>
      )}
    </div>
  );
}
