"use client";

import { useActionState, use, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";

import { login } from "@/app/actions/auth";
import { LineReveal } from "@/components/motion/line-reveal";
import { EASE_PRESS } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/motion/icons";

const fieldClass =
  "w-full min-h-14 border-0 border-b-2 border-outline-variant bg-transparent py-3.5 pl-9 font-headline text-lg tracking-wide text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-brand";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; notice?: string }>;
}) {
  const sp = use(searchParams);
  const notice =
    sp.notice === "deactivated" ? "Your account has been turned off. Ask the shop admin if this is a mistake." : null;
  const redirectTo =
    typeof sp.redirect === "string" && sp.redirect.startsWith("/dashboard")
      ? sp.redirect
      : undefined;
  const [state, formAction, pending] = useActionState(login, {
    error: "",
    redirect: redirectTo,
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-wrap bg-background">
      {/* Brand panel */}
      <section aria-hidden className="relative min-h-72 flex-[1_1_480px] overflow-hidden bg-brand">
        <div className="halftone absolute inset-0 [--dot:rgba(0,0,0,0.22)]" />
        <motion.div
          className="text-outline absolute left-8 top-0 font-headline text-[11rem] font-bold uppercase leading-[0.82] tracking-[-0.06em] text-white/45"
          animate={{ y: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {["Art", "'n Me", "Print", "Press", "Art", "'n Me", "Print", "Press"].map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </motion.div>
        <span className="absolute bottom-0 right-0 h-0 w-0 border-b-[220px] border-l-[220px] border-b-background border-l-transparent" />
        <div className="absolute bottom-10 left-10 flex items-center gap-3.5 bg-[#131313] px-4 py-3.5">
          <img src="/images/art-n-me-logo.jpg" alt="" className="h-10 w-10 object-cover" />
          <span className="spec text-[#e2e2e2]">Production floor · Silay</span>
        </div>
      </section>

      {/* Form */}
      <main className="flex min-w-0 flex-[1_1_520px] items-center justify-center px-6 py-16 md:px-8">
        <div className="w-full max-w-[460px]">
          <Link
            href="/"
            className="spec inline-flex min-h-11 items-center gap-2.5 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            ← Back to site
          </Link>
          <p className="spec mb-4 mt-9 text-accent-ink">Internal access</p>
          <LineReveal
            className="font-headline text-7xl font-bold uppercase leading-[0.86] tracking-[-0.055em] md:text-[5.25rem]"
            lines={[{ text: "Staff" }, { text: "portal.", className: "text-brand" }]}
            delay={0.15}
          />

          <motion.form
            action={formAction}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE_PRESS }}
            className="mt-12 flex flex-col gap-7"
          >
            {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

            {notice && !state?.error && (
              <p role="status" className="border border-outline-variant bg-surface-container-low px-4 py-3.5 text-sm">
                {notice}
              </p>
            )}

            <AnimatePresence>
              {state?.error && (
                <motion.p
                  key={state.error}
                  role="alert"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="animate-shake border border-brand bg-brand/10 px-4 py-3.5 font-headline text-xs font-bold uppercase tracking-[0.08em] text-accent-ink"
                >
                  {state.error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="group">
              <label htmlFor="email" className="spec block text-[11px] text-on-surface-variant group-focus-within:text-accent-ink">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-brand" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="staff@artnme.com"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="spec block text-[11px] text-on-surface-variant group-focus-within:text-accent-ink">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-brand" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`${fieldClass} pr-18`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="spec absolute right-0 top-1/2 min-h-11 -translate-y-1/2 px-2 text-[11px] text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="ink-fill relative mt-3 flex min-h-18 items-center justify-between overflow-hidden bg-brand px-7 font-headline text-xl font-bold uppercase tracking-[0.06em] text-white disabled:cursor-wait"
            >
              {pending ? (
                <>
                  <span>Checking credentials…</span>
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 animate-spin">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  <motion.span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-[3px] w-1/2 bg-white"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="ink-arrow h-6 w-6" />
                </>
              )}
            </button>
          </motion.form>

          <p className="spec mt-14 border-t border-outline-variant/40 pt-5 text-[11px] text-on-surface-variant">
            Accounts are created by an admin · Forgot it? Ask the owner.
          </p>
        </div>
      </main>
    </div>
  );
}
