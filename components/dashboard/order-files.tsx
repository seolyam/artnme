"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink, FileText, Loader2, Trash2, Undo2, Upload } from "lucide-react";
import { toast } from "sonner";
import { removeOrderFile, setProofApproved, uploadOrderFile, type OrderFileView } from "@/app/actions/files";
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { CopyButton } from "@/components/dashboard/copy-button";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,application/pdf";

function isImage(f: OrderFileView) {
  return f.mimeType ? f.mimeType.startsWith("image/") : /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(f.url);
}

/** Proofs and customer files for one order, with upload and customer approval. */
export function OrderFiles({ orderId, files }: { orderId: string; files: OrderFileView[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"proof" | "attachment">("proof");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  async function upload(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(list)) {
      const fd = new FormData();
      fd.set("orderId", orderId);
      fd.set("kind", kind);
      fd.set("file", file);
      const result = await uploadOrderFile(fd);
      if (result.error) toast.error(`${file.name}: ${result.error}`);
      else ok++;
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (ok > 0) {
      toast.success(ok === 1 ? "File uploaded" : `${ok} files uploaded`);
      router.refresh();
    }
  }

  function approve(f: OrderFileView, approved: boolean) {
    setBusyId(f.id);
    startTransition(async () => {
      const result = await setProofApproved(f.id, approved);
      setBusyId(null);
      if (result.error) toast.error(result.error);
      else {
        toast.success(approved ? "Marked as approved by the customer" : "Approval removed");
        router.refresh();
      }
    });
  }

  async function remove(f: OrderFileView) {
    const ok = await confirm({
      title: "Remove this file?",
      description: <p>{f.fileName ?? "The file"} will be taken off the order. This is noted in the activity log.</p>,
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(f.id);
    startTransition(async () => {
      const result = await removeOrderFile(f.id);
      setBusyId(null);
      if (result.error) toast.error(result.error);
      else {
        toast.success("File removed");
        router.refresh();
      }
    });
  }

  const latestProof = [...files].reverse().find((f) => f.kind === "proof");

  return (
    <div className="space-y-4">
      {dialog}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col gap-3 border border-dashed p-4 transition-colors sm:flex-row sm:items-center",
          dragging ? "border-brand bg-brand/5" : "border-outline-variant",
        )}
      >
        <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label="What are you uploading?">
          {(
            [
              ["proof", "Design proof"],
              ["attachment", "File from customer"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={cn(
                "spec min-h-10 px-3 text-[10px] tracking-[0.08em]",
                kind === value ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {text}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex min-h-10 items-center justify-center gap-2 bg-on-surface px-4 text-sm font-semibold text-surface disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Choose file"}
        </button>
        <p className="text-xs text-on-surface-variant">or drag it here · JPG, PNG or PDF up to 9 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          aria-label="Upload files"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No files yet. Upload the design proof here so everyone sees the latest version, then send the customer the link.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {files.map((f) => {
            const proof = f.kind === "proof";
            const busy = busyId === f.id;
            return (
              <li
                key={f.id}
                className={cn(
                  "flex flex-col border bg-surface-container-lowest",
                  f.approvedAt ? "border-success/60" : "border-outline-variant/40",
                  busy && "opacity-60",
                )}
              >
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-[4/3] bg-surface-container">
                  {isImage(f) ? (
                    <Image
                      src={f.url}
                      alt={f.fileName ?? "Order file"}
                      fill
                      sizes="(min-width: 640px) 320px, 100vw"
                      className="object-contain"
                    />
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <FileText className="h-8 w-8" />
                      <span className="spec text-[10px]">PDF · tap to open</span>
                    </span>
                  )}
                  <span className="spec absolute left-2 top-2 bg-background/90 px-1.5 py-0.5 text-[9px]">
                    {proof ? (f.id === latestProof?.id ? "Latest proof" : "Proof") : "From customer"}
                  </span>
                  <ExternalLink className="absolute right-2 top-2 h-4 w-4 text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="truncate text-sm font-semibold" title={f.fileName ?? undefined}>
                    {f.fileName ?? "Untitled file"}
                  </p>
                  <p className="text-xs text-on-surface-variant" suppressHydrationWarning>
                    {f.uploadedByName ?? (proof ? "Staff" : "Website")} · {timeAgo(f.createdAt)}
                  </p>
                  {proof &&
                    (f.approvedAt ? (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-success" suppressHydrationWarning>
                        <BadgeCheck className="h-4 w-4" />
                        Approved by customer · {timeAgo(f.approvedAt)}
                        <button
                          type="button"
                          onClick={() => approve(f, false)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 font-normal text-on-surface-variant underline-offset-2 hover:underline"
                        >
                          <Undo2 className="h-3 w-3" />
                          undo
                        </button>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => approve(f, true)}
                        disabled={busy}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-success/60 text-xs font-semibold text-success hover:bg-success hover:text-white"
                      >
                        <BadgeCheck className="h-4 w-4" />
                        Customer approved this
                      </button>
                    ))}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <CopyButton
                      value={f.url}
                      label="Copy link"
                      toastMessage="Link copied — paste it in Messenger"
                      className="min-h-9 text-xs font-semibold text-on-surface-variant hover:text-on-surface [&_svg]:h-3.5 [&_svg]:w-3.5"
                    />
                    <button
                      type="button"
                      onClick={() => remove(f)}
                      disabled={busy}
                      aria-label={`Remove ${f.fileName ?? "file"}`}
                      className="flex h-9 w-9 items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-accent-ink"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
