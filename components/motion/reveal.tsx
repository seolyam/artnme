"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

export const EASE_PRESS = [0.22, 1, 0.36, 1] as const;
export const EASE_PLATE = [0.77, 0, 0.18, 1] as const;

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
};

/** Fades and lifts its children into place once they scroll into view. */
export function Reveal({
  delay = 0,
  y = 28,
  immediate = false,
  children,
  ...props
}: RevealProps) {
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...(immediate
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, margin: "-80px" } })}
      transition={{ duration: 0.7, delay, ease: EASE_PRESS }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & { stagger?: number; delay?: number };

/** Parent that staggers any `StaggerItem` children as they enter the viewport. */
export function Stagger({ stagger = 0.08, delay = 0, children, ...props }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_PRESS } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
