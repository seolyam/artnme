"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";

import { ThemeToggle } from "@/components/theme-toggle";
import { EASE_PLATE, EASE_PRESS } from "@/components/motion/reveal";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/customizer", label: "3D Studio" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  // Tuck the bar away while reading downward, bring it back on any scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 160 && y > prev);
  });

  // Close the menu whenever navigation completes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-100%" : "0%" }}
        transition={{ duration: 0.35, ease: EASE_PRESS }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
          scrolled || open
            ? "border-outline-variant/30 bg-background/85 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3 md:px-6"
        >
          <Link href="/" className="relative z-50 flex items-center gap-3">
            <img src="/images/art-n-me-logo.jpg" alt="" className="h-11 w-11 object-cover" />
            <span className="font-headline text-lg font-bold uppercase tracking-tight">
              Art &apos;n Me
            </span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "font-headline text-sm font-medium uppercase tracking-[0.08em] transition-colors",
                      active
                        ? "text-on-surface"
                        : "text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {link.label}
                  </Link>
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden md:flex" />
            <Link
              href="/quote"
              className="hidden h-11 items-center bg-brand px-5 font-headline text-xs font-bold uppercase tracking-[0.16em] text-white transition-[background-color,transform] hover:bg-[#ff2b31] active:scale-95 md:flex"
            >
              Get a quote
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-6 bg-on-surface"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-6 bg-on-surface"
              />
            </button>
          </div>
        </nav>
        {/* Reading progress, printed like a feed line */}
        <motion.div
          aria-hidden
          style={{ scaleX: scrollYProgress }}
          className="absolute bottom-0 left-0 right-0 h-px origin-left bg-brand"
        />
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: EASE_PLATE }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-surface px-6 pb-10 pt-28 md:hidden"
          >
            <ul className="space-y-2">
              {[...LINKS, { href: "/quote", label: "Get a quote" }].map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: EASE_PRESS }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-baseline gap-4 font-headline text-5xl font-bold uppercase tracking-tighter",
                        isActive(pathname, link.href) || link.href === "/quote"
                          ? "text-brand"
                          : "text-on-surface",
                      )}
                    >
                      <span className="spec text-on-surface-variant">0{i + 1}</span>
                      {link.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-end justify-between gap-4 border-t border-outline-variant/30 pt-6"
            >
              <div className="spec space-y-2 text-on-surface-variant">
                <a href={SITE.phoneHref} className="block text-on-surface">
                  {SITE.phoneDisplay}
                </a>
                <p>{SITE.hoursLabel}</p>
              </div>
              <ThemeToggle />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
