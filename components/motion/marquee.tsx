import { cn } from "@/lib/utils";

/** Endless ticker. Content is rendered twice so the loop is seamless. */
export function Marquee({
  items,
  className,
  duration = 32,
}: {
  items: string[];
  className?: string;
  duration?: number;
}) {
  const row = (hidden: boolean) => (
    <span
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {items.map((item) => (
        <span key={item} className="flex items-center gap-10">
          <span>{item}</span>
          <span aria-hidden>✕</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={cn("marquee-pause overflow-hidden", className)}>
      <div
        className="animate-marquee flex w-max whitespace-nowrap"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
