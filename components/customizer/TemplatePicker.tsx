"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCustomizer, type DesignAsset } from "@/components/customizer/CustomizerProvider";
import {
  SHIRT_TEMPLATES,
  loadTemplateFont,
  piecePose,
  renderPiece,
  templateDefaults,
  templateOnShirt,
  type ShirtTemplate,
} from "@/lib/customizer/templates";
import { PRINT_COLORS } from "@/lib/customizer/colors";
import { DescribeShirt, type StudioPrefill } from "@/components/customizer/describe-shirt";
import { useStudioAi } from "@/components/customizer/studio-ai";

/**
 * "Ready-made designs" for the studio's Design step. The customer picks one,
 * types their own words into plain labelled boxes while a preview updates, and
 * it lands on the 3D shirt as ordinary layers they can still move or delete.
 */
export function TemplatePicker() {
  const font = useTemplateFont();
  const { assets } = useCustomizer();
  const ai = useStudioAi();
  const [chosen, setChosen] = useState<ShirtTemplate | null>(null);
  const [prefill, setPrefill] = useState<StudioPrefill | null>(null);
  const current = templateOnShirt(assets);

  const choose = (t: ShirtTemplate, fill: StudioPrefill | null = null) => {
    setPrefill(fill);
    setChosen(t);
  };

  // Card thumbnails with the sample words, drawn once the font is ready.
  const thumbs = useMemo(() => {
    if (!font) return null;
    return Object.fromEntries(
      SHIRT_TEMPLATES.map((t) => [t.id, t.pieces.map((p) => renderPiece(p, templateDefaults(t), font, 320))]),
    );
  }, [font]);

  return (
    <>
      {current && (
        <div className="flex flex-col gap-3 border-2 border-brand/70 bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">
            On your shirt now:{" "}
            <strong className="font-headline font-bold uppercase text-on-surface">{current.template.name}</strong>
          </p>
          <TemplateActions />
        </div>
      )}
      {ai && <DescribeShirt onSuggest={choose} />}
      <ul className="grid grid-cols-2 gap-3" aria-label="Ready-made designs">
        {SHIRT_TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => choose(t)}
              className="group flex h-full w-full flex-col border border-outline-variant/40 bg-surface-container-lowest text-left transition-colors hover:border-brand focus-visible:border-brand"
            >
              <span className="block w-full bg-surface-container px-2 pt-3">
                {thumbs ? (
                  <ShirtPair template={t} art={thumbs[t.id]} />
                ) : (
                  <span className="block aspect-[2/1] w-full animate-pulse bg-surface-container-high" />
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1 p-3">
                <span className="font-headline text-sm font-bold uppercase leading-tight text-on-surface group-hover:text-brand">
                  {t.name}
                </span>
                <span className="text-xs leading-snug text-on-surface-variant">{t.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!chosen} onOpenChange={(open) => !open && setChosen(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border border-outline-variant bg-surface p-0 text-on-surface sm:max-w-3xl"
        >
          {chosen && font && (
            <TemplateForm
              key={chosen.id}
              template={chosen}
              prefill={prefill ?? undefined}
              font={font}
              onDone={() => setChosen(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * What can be done with the ready-made design on the shirt: "Edit the words"
 * reopens its form with the words it was made with; "Remove this design" takes
 * it off (with an undo). Shown above the template cards and in the layer
 * editor when a template print is selected.
 */
export function TemplateActions() {
  const font = useTemplateFont();
  const { assets, shirtColor, removeTemplate, replaceDesign } = useCustomizer();
  const [open, setOpen] = useState(false);
  const current = templateOnShirt(assets);
  if (!current) return null;

  const remove = () => {
    const before = removeTemplate(current.template.id);
    toast.success(`${current.template.name} design removed from your shirt.`, {
      action: { label: "Undo", onClick: () => replaceDesign(shirtColor, before) },
      // Long enough for a slow reader to find Undo (the default is 4 s), and a
      // real button rather than sonner's faint default link.
      duration: 10_000,
      actionButtonStyle: {
        background: "#ffffff",
        color: "#14532d",
        fontWeight: 700,
        fontSize: 14,
        height: 36,
        padding: "0 16px",
      },
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!font}
          className="flex min-h-13 w-full items-center justify-center gap-2 bg-brand px-5 font-headline text-sm font-bold uppercase tracking-[0.12em] text-white transition-[filter] hover:brightness-110 disabled:opacity-60"
        >
          <Pencil aria-hidden className="h-4 w-4" />
          Edit the words
        </button>
        <button
          type="button"
          onClick={remove}
          className="flex min-h-12 w-full items-center justify-center gap-2 border-2 border-outline-variant px-5 font-headline text-sm font-bold uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-brand hover:text-brand"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          Remove this design
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border border-outline-variant bg-surface p-0 text-on-surface sm:max-w-3xl"
        >
          {open && font && (
            <TemplateForm
              template={current.template}
              initialValues={current.values}
              font={font}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Fill-in form for a template. With `initialValues` it edits the design already
 * on the shirt; with `prefill` it's a new design started from "Describe your
 * event" (the customer's words and a shirt color), still applied only on submit.
 */
function TemplateForm({
  template,
  initialValues,
  prefill,
  font,
  onDone,
}: {
  template: ShirtTemplate;
  initialValues?: Record<string, string>;
  prefill?: StudioPrefill;
  font: string;
  onDone: () => void;
}) {
  const { assets, replaceDesign, retextTemplate } = useCustomizer();
  const editing = !!initialValues;
  const [values, setValues] = useState(() => initialValues ?? prefill?.values ?? templateDefaults(template));
  const shirtColor = prefill?.shirtColor ?? template.shirtColor;
  const shirtLabel = PRINT_COLORS.find((c) => c.hex === shirtColor)?.name ?? template.shirtLabel;
  const art = useMemo(() => template.pieces.map((p) => renderPiece(p, values, font, 520)), [template, values, font]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      // New artwork only; the prints stay where the customer put them, on the color they chose.
      retextTemplate(
        template.id,
        values,
        Object.fromEntries(template.pieces.map((piece) => [piece.id, renderPiece(piece, values, font)])),
      );
      toast.success("Words updated on your shirt.");
      onDone();
      return;
    }
    const layers: DesignAsset[] = template.pieces.map((piece) => ({
      id: crypto.randomUUID(),
      kind: "image",
      url: renderPiece(piece, values, font),
      fileName: `${template.name} · ${piece.label}`,
      placement: piece.placement,
      flipped: false,
      visible: true,
      template: { id: template.id, piece: piece.id, values },
      ...piecePose(piece),
    }));
    replaceDesign(shirtColor, layers);
    toast.success("Design added to your shirt. To change the words later, press Edit the words.");
    onDone();
  };

  return (
    <form onSubmit={apply}>
      <div className="border-b border-outline-variant/50 px-6 py-5">
        <DialogTitle className="font-headline text-2xl font-bold uppercase tracking-tight">{template.name}</DialogTitle>
        <DialogDescription className="mt-1 text-base text-on-surface-variant">
          {editing
            ? "Change any of the words below. Your prints stay where you put them."
            : "Type your own words below. The picture changes as you type."}
        </DialogDescription>
        {prefill?.reason && <p className="mt-2 text-sm text-on-surface-variant">Suggested: {prefill.reason}</p>}
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="bg-surface-container px-3 pt-5">
            <ShirtPair template={template} art={art} labels />
          </div>
          {!editing && (
            <p className="mt-2 text-sm text-on-surface-variant">
              {shirtLabel} shirt · you can change the color later
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {template.fields.map((field) => {
            const id = `tpl-${template.id}-${field.key}`;
            return (
              <div key={field.key}>
                <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-base font-semibold">
                  {field.label}
                  {field.hint && <span className="text-sm font-normal text-on-surface-variant">{field.hint}</span>}
                </label>
                <input
                  id={id}
                  value={values[field.key] ?? ""}
                  maxLength={field.maxLength}
                  inputMode={field.numeric ? "numeric" : "text"}
                  autoComplete="off"
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="mt-1.5 min-h-13 w-full border-2 border-outline-variant bg-surface-container-lowest px-4 text-lg text-on-surface outline-none transition-colors focus:border-brand"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-outline-variant/50 px-6 py-5 sm:flex-row-reverse sm:items-center">
        <button
          type="submit"
          className="flex min-h-14 flex-1 items-center justify-center gap-2 bg-brand px-6 font-headline text-lg font-bold uppercase tracking-[0.04em] text-white transition-[filter] hover:brightness-110"
        >
          {editing ? "Save the words" : "Put it on my shirt"}
          <ArrowRight aria-hidden className="h-5 w-5" />
        </button>
        <DialogClose className="flex min-h-14 items-center justify-center border-2 border-outline-variant px-6 text-lg font-semibold transition-colors hover:border-on-surface">
          Cancel
        </DialogClose>
      </div>
      {!editing && assets.length > 0 && (
        <p className="-mt-2 px-6 pb-5 text-sm text-on-surface-variant">
          This replaces the design that is on your shirt now.
        </p>
      )}
    </form>
  );
}

function useTemplateFont() {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadTemplateFont().then((f) => live && setFont(f));
    return () => {
      live = false;
    };
  }, []);
  return font;
}

// ---------------------------------------------------------------------------
// Flat front/back shirt preview
// ---------------------------------------------------------------------------

/** Model units → preview pixels. Shoulders (y 1.63) sit at the top of the body, the hem (y 0.92) at the bottom. */
const PX = 231;
const sx = (x: number, back: boolean) => 100 + (back ? -x : x) * PX;
const sy = (y: number) => 26 + (1.63 - y) * PX;

const BODY =
  "M78 16 L40 26 L6 60 L26 80 L40 68 L40 192 L160 192 L160 68 L174 80 L194 60 L160 26 L122 16";

function ShirtPair({ template, art, labels }: { template: ShirtTemplate; art: string[]; labels?: boolean }) {
  return (
    <span className="grid grid-cols-2 gap-1">
      {(["front", "back"] as const).map((side) => (
        <span key={side} className="block">
          <FlatShirt side={side} color={template.shirtColor} template={template} art={art} />
          {labels && (
            <span className="block pb-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              {side}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

function FlatShirt({
  side,
  color,
  template,
  art,
}: {
  side: "front" | "back";
  color: string;
  template: ShirtTemplate;
  art: string[];
}) {
  const clip = useId();
  const back = side === "back";
  const collar = back ? "Q100 26 78 16 Z" : "Q100 44 78 16 Z";
  const path = `${BODY} ${collar}`;
  const light = color.toUpperCase() === "#FFFFFF" || color.toUpperCase() === "#B8B5B0";

  return (
    <svg viewBox="0 0 200 200" className="block w-full" role="img" aria-label={`${template.name}, ${side}`}>
      <defs>
        <clipPath id={clip}>
          <path d={path} />
        </clipPath>
      </defs>
      <path d={path} fill={color} stroke={light ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.12)"} strokeWidth={1.2} />
      <g clipPath={`url(#${clip})`}>
        {template.pieces.map((piece, i) =>
          piece.placement === side && art[i] ? (
            <image
              key={piece.id}
              href={art[i]}
              x={sx(piece.x ?? 0, back) - (piece.width * PX) / 2}
              y={sy(piece.y) - (piece.height * PX) / 2}
              width={piece.width * PX}
              height={piece.height * PX}
            />
          ) : null,
        )}
      </g>
      {/* Collar band */}
      <path
        d={back ? "M78 16 Q100 26 122 16" : "M78 16 Q100 44 122 16"}
        fill="none"
        stroke={light ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.35)"}
        strokeWidth={3}
      />
    </svg>
  );
}
