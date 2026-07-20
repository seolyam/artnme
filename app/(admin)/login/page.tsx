"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: "" });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden text-[#E31E24]">
        <div className="absolute -top-[10%] -left-[10%] text-[40rem] font-black italic select-none leading-none font-headline">
          ART
        </div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="bg-surface-container-low border border-outline-variant/30 dark:border-white/5 shadow-[0_0_100px_rgba(227,30,36,0.05)] p-12 md:p-16">
          <header className="mb-12">
            <Link
              href="/"
              className="text-xl font-black text-on-surface/40 uppercase italic font-headline tracking-tighter hover:text-on-surface dark:text-white/40 dark:hover:text-white transition-colors mb-8 block"
            >
              ← Return to Site
            </Link>
            <span className="text-primary-container font-headline font-bold uppercase tracking-[0.3em] text-xs block mb-4">
              Internal Access
            </span>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-on-surface dark:text-white leading-[0.85] tracking-tighter uppercase italic">
              STAFF
              <br />
              <span className="text-primary-container">PORTAL.</span>
            </h1>
          </header>

          <form action={formAction} className="space-y-10">
            {state?.error && (
              <div className="bg-primary-container/10 border-l-4 border-primary-container p-6 animate-in fade-in slide-in-from-left-4">
                <p className="text-primary-container font-headline font-bold uppercase text-xs tracking-widest">
                  {state.error}
                </p>
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                  Credential / Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/30 dark:text-white/20 group-focus-within:text-primary-container transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 pl-10 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide text-lg"
                    placeholder="ADMIN@ARTNME.COM"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                  Security Code / Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/30 dark:text-white/20 group-focus-within:text-primary-container transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 pl-10 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide text-lg"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-primary-container py-6 group relative overflow-hidden transition-all active:scale-[0.98] border border-primary-container disabled:opacity-50"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  <span className="font-headline font-black text-2xl tracking-tighter italic uppercase text-on-primary-container group-hover:tracking-[0.1em] transition-all">
                    {pending ? "Authenticating..." : "Authorize Access"}
                  </span>
                  {!pending && (
                    <ArrowRight className="w-6 h-6 text-on-primary-container group-hover:translate-x-2 transition-transform" />
                  )}
                </div>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 mix-blend-overlay"></div>
              </button>
            </div>
          </form>

          <footer className="mt-16 pt-8 border-t border-outline-variant/30 dark:border-white/5 flex justify-between items-center">
            <span className="text-[8px] uppercase tracking-[0.4em] text-on-surface/40 dark:text-white/20">
              Secure Production Floor Node
            </span>
            <span className="text-[8px] uppercase tracking-[0.4em] text-on-surface/40 dark:text-white/20">
              © 2026 Art &apos;n Me
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
