"use client";

import { motion } from "framer-motion";

/** Every public route enters with a short lift; a red plate sweeps off the top edge. */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 0.6, ease: [0.77, 0, 0.18, 1] }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 origin-right bg-brand"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
