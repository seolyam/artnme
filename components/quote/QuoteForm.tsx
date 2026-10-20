"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import { submitQuote, type QuoteState } from "@/app/actions/quotes";
import { EASE_PLATE, EASE_PRESS } from "@/components/motion/reveal";
import { ArrowRight } from "@/components/motion/icons";
import { QUOTE_PRODUCTS, type QuoteProduct } from "@/lib/validators";
import { cn } from "@/lib/utils";

const INITIAL: QuoteState = { status: "idle" };

const fieldClass =
  "w-full min-h-13 border-0 border-b-2 border-[#8a817d] bg-transparent py-3 font-headline text-lg text-[#161514] outline-none transition-colors placeholder:text-[#8a817d] focus:border-brand aria-[invalid=true]:border-[#b31218]";
const labelClass = "spec block text-[11px] text-[#b31218]";

export function QuoteForm({
  initialProduct,
  source,
}: {
  initialProduct?: QuoteProduct;
  source?: string;
}) {
  // Remounting the inner form gives a clean slate after "Send another".
  const [round, setRound] = useState(0);
  return (
    <QuoteTicket
      key={round}
      initialProduct={initialProduct}
      source={source}
      onReset={() => setRound((r) => r + 1)}
    />
  );
}

function QuoteTicket({
  initialProduct = "T-Shirt",
  source,
  onReset,
}: {
  initialProduct?: QuoteProduct;
  source?: string;
  onReset: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitQuote, INITIAL);
  const [product, setProduct] = useState<QuoteProduct>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Submitting through a transition keeps the typed values on validation errors.
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setAttempt((a) => a + 1);
    startTransition(() => formAction(data));
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && fileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
      setFileName(file.name);
    }
  };

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-0 translate-x-3.5 translate-y-3.5 bg-brand" />

      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <motion.div
            key="done"
            role="status"
            initial={{ opacity: 0, y: -40, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, ease: EASE_PRESS }}
            className="relative overflow-hidden bg-[#f4f1ec] pb-12 text-[#161514]"
          >
            <div aria-hidden className="perforation" />
            <div className="px-6 pt-12 md:px-11">
              <p className="spec mb-3 text-[#5a5250]">
                Job ticket
                {state.orderNumber ? ` · Ref #${String(state.orderNumber).padStart(4, "0")}` : ""}
              </p>
              <h2 className="font-headline text-[clamp(2.5rem,5vw,4rem)] font-bold uppercase leading-[0.9] tracking-[-0.045em]">
                Salamat, {state.firstName}.
                <br />
                It&apos;s on the board.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-[#4c4542]">
                We&apos;ll send your proof and price
                {state.contact ? ` to ${state.contact}` : ""}, usually within 1–2
                production hours.
              </p>
              {state.productLabel && (
                <dl className="mt-9 grid grid-cols-3 border-y-2 border-dashed border-[#bdb3ae]">
                  {[
                    ["Item", state.productLabel],
                    ["Quantity", String(state.quantity).padStart(2, "0")],
                    ["Status", "Pending"],
                  ].map(([k, v]) => (
                    <div key={k} className="py-4">
                      <dt className="spec text-[11px] text-[#5a5250]">{k}</dt>
                      <dd className="mt-1.5 font-headline text-lg font-bold uppercase md:text-xl">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onReset}
                  className="ink-fill min-h-14 bg-brand px-6 font-headline text-sm font-bold uppercase tracking-[0.14em] text-white [--ink-flood:#161514] [--ink-flood-fg:#ffffff]"
                >
                  Send another
                </button>
                <Link
                  href="/portfolio"
                  className="inline-flex min-h-14 items-center border-2 border-[#161514] px-6 font-headline text-sm font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#161514] hover:text-[#f4f1ec]"
                >
                  Browse the portfolio
                </Link>
              </div>
            </div>
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
              animate={{ opacity: 0.9, scale: 1, rotate: -14 }}
              transition={{ delay: 0.35, duration: 0.6, ease: EASE_PRESS }}
              className="absolute right-6 top-10 border-4 border-brand px-4 py-2 font-headline text-2xl font-bold uppercase tracking-[0.08em] text-brand md:right-9 md:top-16 md:text-3xl"
            >
              Received
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0, y: -40, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_PRESS }}
            className="relative bg-[#f4f1ec] pb-10 text-[#161514]"
          >
            <div aria-hidden className="perforation" />
            <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-[#bdb3ae] px-6 py-5 md:px-11">
              <span className="font-headline text-xl font-bold uppercase tracking-tight">Job ticket</span>
              <span className="spec text-[11px] text-[#5a5250]">Ref assigned on submit</span>
            </div>

            {/* Anti-spam: a field people never see, and the time the form opened. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Company
                <input type="text" name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />
            <input type="hidden" name="product" value={product} />
            {source && <input type="hidden" name="source" value={source} />}

            <div className="flex flex-col gap-9 px-6 pt-9 md:px-11">
              {state.status === "error" && state.message && (
                <p
                  key={attempt}
                  role="alert"
                  className="animate-shake bg-brand px-4 py-3.5 font-headline text-sm font-bold uppercase tracking-[0.06em] text-white"
                >
                  {state.message}
                </p>
              )}

              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-name" className={labelClass}>
                    Full name *
                  </label>
                  <input
                    id="q-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Juan Dela Cruz"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "q-name-err" : undefined}
                    className={fieldClass}
                  />
                  <FieldError id="q-name-err" message={errors.name} />
                </div>
                <div>
                  <label htmlFor="q-contact" className={labelClass}>
                    Phone number *
                  </label>
                  <input
                    id="q-contact"
                    name="contact"
                    type="tel"
                    autoComplete="tel"
                    placeholder="09XX XXX XXXX"
                    aria-invalid={!!errors.contact}
                    aria-describedby={errors.contact ? "q-contact-err" : undefined}
                    className={fieldClass}
                  />
                  <FieldError id="q-contact-err" message={errors.contact} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="q-email" className={labelClass}>
                    Email *
                  </label>
                  <input
                    id="q-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="juan@email.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "q-email-err" : undefined}
                    className={fieldClass}
                  />
                  <FieldError id="q-email-err" message={errors.email} />
                </div>
              </div>

              <fieldset>
                <legend className={cn(labelClass, "mb-3.5")}>What are we printing?</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {QUOTE_PRODUCTS.map((p, i) => {
                    const active = p.value === product;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setProduct(p.value)}
                        className={cn(
                          "relative flex min-h-22 flex-col justify-between overflow-hidden border-2 p-3.5 text-left transition-[transform,border-color] duration-300 hover:-translate-y-0.5",
                          active ? "border-[#161514] text-[#f4f1ec]" : "border-[#bdb3ae] hover:border-[#161514]",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="quote-product"
                            className="absolute inset-0 bg-[#161514]"
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          />
                        )}
                        {active && (
                          <span aria-hidden className="absolute right-0 top-0 h-0 w-0 border-l-[26px] border-t-[26px] border-l-transparent border-t-brand" />
                        )}
                        <span className={cn("spec relative text-[11px]", active ? "text-[#bdb3ae]" : "text-[#5a5250]")}>
                          0{i + 1}
                        </span>
                        <span className="relative font-headline text-base font-bold uppercase">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-qty" className={labelClass}>
                    Quantity
                  </label>
                  <div className="mt-1 flex items-stretch border-b-2 border-[#8a817d] focus-within:border-brand">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="w-13 text-2xl transition-colors hover:bg-[#e5dfdb]"
                    >
                      −
                    </button>
                    <input
                      id="q-qty"
                      name="quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                      aria-invalid={!!errors.quantity}
                      className="min-h-13 w-full min-w-0 bg-transparent text-center font-headline text-3xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10000, q + 1))}
                      aria-label="Increase quantity"
                      className="w-13 text-2xl transition-colors hover:bg-[#e5dfdb]"
                    >
                      +
                    </button>
                  </div>
                  <FieldError id="q-qty-err" message={errors.quantity} />
                </div>
                <div>
                  <label htmlFor="q-date" className={labelClass}>
                    Needed by (optional)
                  </label>
                  <input
                    id="q-date"
                    name="neededBy"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    suppressHydrationWarning
                    aria-invalid={!!errors.neededBy}
                    className={cn(fieldClass, "[color-scheme:light]")}
                  />
                  <FieldError id="q-date-err" message={errors.neededBy} />
                </div>
              </div>

              <div>
                <label htmlFor="q-details" className={labelClass}>
                  Project details
                </label>
                <textarea
                  id="q-details"
                  name="details"
                  rows={3}
                  maxLength={2000}
                  placeholder="Sizes, colors, names and numbers, finish…"
                  aria-invalid={!!errors.details}
                  className={cn(fieldClass, "resize-y font-body text-base leading-relaxed")}
                />
                <FieldError id="q-details-err" message={errors.details} />
              </div>

              <div>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex cursor-pointer items-center gap-5 border-2 border-dashed p-6 transition-colors focus-within:border-brand",
                    dragging ? "border-brand bg-[#ece6e2]" : "border-[#8a817d] bg-[#ece6e2] hover:border-brand",
                  )}
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#161514]">
                    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="#f4f1ec" strokeWidth={2} className="h-6 w-6">
                      <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-headline text-base font-bold uppercase">
                      {fileName ?? "Attach your design"}
                    </span>
                    <span className="text-sm text-[#4c4542]">
                      {fileName
                        ? "Tap to choose a different file"
                        : "PNG, JPG, SVG or PDF · up to 8 MB · or your 3D Studio mockup"}
                    </span>
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    name="attachment"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                    className="sr-only"
                  />
                </label>
                <FieldError id="q-file-err" message={errors.attachment} />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={pending}
                  className="ink-fill relative flex min-h-19 w-full items-center justify-between bg-brand px-7 font-headline text-xl font-bold uppercase tracking-[0.04em] text-white disabled:cursor-wait [--ink-flood:#161514] [--ink-flood-fg:#ffffff] md:text-2xl"
                >
                  {pending ? (
                    <>
                      <span>Sending to the press…</span>
                      <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6 animate-spin">
                        <path d="M12 3a9 9 0 1 0 9 9" />
                      </svg>
                      <motion.span
                        aria-hidden
                        className="absolute bottom-0 left-0 h-1 w-full origin-left bg-[#161514]"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 0.9 }}
                        transition={{ duration: 3, ease: EASE_PLATE }}
                      />
                    </>
                  ) : (
                    <>
                      <span>Submit inquiry</span>
                      <ArrowRight className="ink-arrow h-6 w-6" />
                    </>
                  )}
                </button>
                <p className="spec mt-4 text-center text-[10px] text-[#5a5250]">
                  Estimates usually take 1–2 production hours
                </p>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-1.5 text-sm font-semibold text-[#b31218]"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
