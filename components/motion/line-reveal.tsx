"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_PRESS } from "./reveal";

type Line = { text: string; className?: string; misregister?: boolean };

/**
 * Display headline whose lines rise out of a mask one after another, like
 * sheets feeding out of a press. `misregister` adds the offset outline echo.
 */
export function LineReveal({
  lines,
  as: Tag = "h1",
  className,
  delay = 0.1,
  stagger = 0.12,
  inView = false,
}: {
  lines: Line[];
  as?: "h1" | "h2";
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
}) {
  // Observe the heading, not the lines: a line parked below its mask is
  // clipped away and would never register as visible.
  const ref = useRef<HTMLHeadingElement>(null);
  const seen = useInView(ref, { once: true, margin: "-60px" });
  const show = inView ? seen : true;

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.04em]">
          <motion.span
            className={cn("relative block", line.className)}
            initial={{ y: "110%" }}
            animate={{ y: show ? 0 : "110%" }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: EASE_PRESS }}
          >
            {line.misregister && (
              <span
                aria-hidden
                className="text-outline animate-misregister absolute inset-0 text-on-surface opacity-35"
              >
                {line.text}
              </span>
            )}
            <span className="relative">{line.text}</span>
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
