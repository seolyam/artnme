"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail, RefreshCw, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  inviteStaff,
  setStaffActive,
  setStaffPassword,
  setStaffRole,
  type StaffMember,
} from "@/app/actions/staff";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/dashboard/confirm-dialog";
import { CopyButton } from "@/components/dashboard/copy-button";
import { initials } from "@/lib/order-status";
import { formatShopDate, timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const ROLE_HELP = {
  staff: "Take orders, update status, record payments, message customers.",
  admin: "Everything staff can do, plus delete orders, void payments, edit prices and manage staff.",
};

/** A readable temporary password: no look-alike characters, 12 long. */
function makePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function StaffManager({
  staff,
  meId,
  canManageAuth = true,
}: {
  staff: StaffMember[];
  meId: string;
  canManageAuth?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [passwordFor, setPasswordFor] = useState<StaffMember | null>(null);
  const { confirm, dialog } = useConfirm();

  const active = staff.filter((s) => !s.deactivatedAt);
  const inactive = staff.filter((s) => s.deactivatedAt);

  function run(
    id: string,
    fn: () => Promise<{ error?: string } | { success: true; banWarning?: string | null }>,
    ok: string,
  ) {
    setBusyId(id);
    startTransition(async () => {
      const result = await fn();
      setBusyId(null);
      if ("error" in result && result.error) toast.error(result.error);
      else {
        toast.success(ok);
        if ("banWarning" in result && result.banWarning) {
          toast.warning("Saved in the portal, but Supabase wasn't updated", { description: result.banWarning, duration: 12_000 });
        }
        router.refresh();
      }
    });
  }

  async function toggleActive(member: StaffMember) {
    const turningOff = !member.deactivatedAt;
    const ok = await confirm(
      turningOff
        ? {
            title: `Deactivate ${member.fullName}?`,
            description: (
              <>
                <p>They won&apos;t be able to sign in. Their name stays on old orders, payments and notes.</p>
                {member.openJobs > 0 && (
                  <p className="mt-2">
                    Their {member.openJobs} open job{member.openJobs === 1 ? "" : "s"} will go back to{" "}
                    <span className="font-semibold">Unassigned</span> so someone else can pick them up.
                  </p>
                )}
                <p className="mt-2">You can reactivate the account later.</p>
              </>
            ),
            confirmLabel: "Deactivate",
            tone: "danger",
          }
        : {
            title: `Reactivate ${member.fullName}?`,
            description: <p>They&apos;ll be able to sign in again with their old password.</p>,
            confirmLabel: "Reactivate",
          },
    );
    if (!ok) return;
    run(
      member.id,
      () => setStaffActive(member.id, !turningOff),
      turningOff ? `${member.fullName} deactivated` : `${member.fullName} can sign in again`,
    );
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={!canManageAuth}
          title={canManageAuth ? undefined : "Needs a working Supabase service key"}
          className="disabled:opacity-50 disabled:pointer-events-none ink-fill inline-flex min-h-12 items-center gap-2 bg-brand px-5 font-headline text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          <UserPlus className="h-4 w-4" />
          Add staff
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="spec text-[11px] text-on-surface-variant">Active · {active.length}</h2>
        <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
          {active.map((m) => (
            <StaffRow
              key={m.id}
              member={m}
              isMe={m.id === meId}
              busy={busyId === m.id && pending}
              onRole={(role) => run(m.id, () => setStaffRole(m.id, role), `${m.fullName} is now ${role === "admin" ? "an admin" : "staff"}`)}
              onPassword={canManageAuth ? () => setPasswordFor(m) : undefined}
              onToggle={() => toggleActive(m)}
            />
          ))}
        </ul>
      </section>

      {inactive.length > 0 && (
        <section className="space-y-2">
          <h2 className="spec text-[11px] text-on-surface-variant">Deactivated · {inactive.length}</h2>
          <ul className="divide-y divide-outline-variant/30 border border-outline-variant/30">
            {inactive.map((m) => (
              <StaffRow
                key={m.id}
                member={m}
                isMe={false}
                busy={busyId === m.id && pending}
                onToggle={() => toggleActive(m)}
              />
            ))}
          </ul>
        </section>
      )}

      <AddStaffDialog open={adding} onOpenChange={setAdding} onDone={() => router.refresh()} />
      {passwordFor && (
        <SetPasswordDialog key={passwordFor.id} member={passwordFor} onClose={() => setPasswordFor(null)} />
      )}
    </div>
  );
}

function StaffRow({
  member,
  isMe,
  busy,
  onRole,
  onPassword,
  onToggle,
}: {
  member: StaffMember;
  isMe: boolean;
  busy: boolean;
  onRole?: (role: "admin" | "staff") => void;
  onPassword?: () => void;
  onToggle: () => void;
}) {
  const off = !!member.deactivatedAt;
  const status = off
    ? `Deactivated ${formatShopDate(member.deactivatedAt!, { month: "short", day: "numeric", year: "numeric" })}`
    : member.lastSignInAt
      ? `Last signed in ${timeAgo(member.lastSignInAt)}`
      : "Hasn't signed in yet";

  return (
    <li className={cn("flex flex-col gap-3 bg-surface-container-lowest p-4 md:flex-row md:items-center", off && "opacity-70")}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center font-headline text-xs font-bold",
            off ? "border border-dashed border-outline-variant text-on-surface-variant" : "bg-on-surface text-surface",
          )}
        >
          {initials(member.fullName)}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {member.fullName}
            {isMe && <span className="spec bg-surface-container-high px-1.5 py-0.5 text-[9px] text-on-surface-variant">You</span>}
            <span
              className={cn(
                "spec px-1.5 py-0.5 text-[9px]",
                member.role === "admin" ? "bg-brand/15 text-accent-ink" : "bg-surface-container-high text-on-surface-variant",
              )}
            >
              {member.role}
            </span>
          </p>
          <p className="truncate text-xs text-on-surface-variant" suppressHydrationWarning>
            {member.email ?? "No email"} · {status}
            {member.openJobs > 0 && !off && ` · ${member.openJobs} open job${member.openJobs === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {!isMe && (
        <div className="flex flex-wrap items-center gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-on-surface-variant" />}
          {onRole && (
            <div className="flex gap-0.5 bg-surface-container-high p-0.5" role="group" aria-label={`Role for ${member.fullName}`}>
              {(["staff", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={member.role === r}
                  disabled={busy || member.role === r}
                  onClick={() => onRole(r)}
                  title={ROLE_HELP[r]}
                  className={cn(
                    "spec min-h-9 px-3 text-[10px] tracking-[0.08em]",
                    member.role === r ? "bg-surface-container-lowest text-on-surface" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          {onPassword && (
            <button
              type="button"
              onClick={onPassword}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-1.5 border border-outline-variant/60 px-3 text-xs font-semibold hover:border-on-surface-variant"
            >
              <KeyRound className="h-3.5 w-3.5" />
              New password
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 border px-3 text-xs font-semibold",
              off
                ? "border-outline-variant/60 hover:border-on-surface-variant"
                : "border-outline-variant/60 text-on-surface-variant hover:border-brand hover:text-accent-ink",
            )}
          >
            {off ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
            {off ? "Reactivate" : "Deactivate"}
          </button>
        </div>
      )}
    </li>
  );
}

function AddStaffDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [mode, setMode] = useState<"invite" | "password">("invite");
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password?: string } | null>(null);

  function reset() {
    setFullName("");
    setEmail("");
    setRole("staff");
    setMode("invite");
    setPassword("");
    setCreated(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteStaff(
        mode === "invite" ? { mode, email, fullName, role } : { mode, email, fullName, role, password },
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onDone();
      setCreated({ email, password: mode === "password" ? password : undefined });
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold uppercase tracking-[-0.02em]">
            {created ? "Account ready" : "Add staff"}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            {created
              ? created.password
                ? "Give them these details. They can change the password later under Account."
                : `An invite was sent to ${created.email}. They'll pick a password from the link in the email.`
              : "Create a login for someone who works at the shop."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            {created.password && (
              <div className="space-y-2 bg-surface-container-low p-4 font-mono text-sm">
                <p>
                  <span className="text-on-surface-variant">Email:</span> {created.email}
                </p>
                <p>
                  <span className="text-on-surface-variant">Password:</span> {created.password}
                </p>
                <CopyButton
                  value={`Art 'n Me staff portal\nEmail: ${created.email}\nPassword: ${created.password}`}
                  label="Copy login details"
                  toastMessage="Login details copied"
                  className="min-h-9 border border-outline-variant/60 px-3 font-sans text-xs font-semibold"
                />
              </div>
            )}
            {!created.password && (
              <p className="text-sm text-on-surface-variant">
                No email after a few minutes? Check spam, or open their row and press{" "}
                <span className="font-semibold">New password</span> to set one yourself.
              </p>
            )}
            <DialogFooter>
              <Button className="min-h-10 rounded-none" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-11 rounded-none" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-none" />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">What can they do?</legend>
              {(["staff", "admin"] as const).map((r) => (
                <label
                  key={r}
                  className={cn(
                    "flex cursor-pointer gap-3 border p-3",
                    role === r ? "border-on-surface bg-surface-container-low" : "border-outline-variant/50",
                  )}
                >
                  <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="mt-1 accent-[var(--color-brand)]" />
                  <span>
                    <span className="block text-sm font-semibold capitalize">{r}</span>
                    <span className="block text-xs text-on-surface-variant">{ROLE_HELP[r]}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">How will they sign in?</legend>
              <label className={cn("flex cursor-pointer gap-3 border p-3", mode === "invite" ? "border-on-surface bg-surface-container-low" : "border-outline-variant/50")}>
                <input type="radio" name="mode" checked={mode === "invite"} onChange={() => setMode("invite")} className="mt-1 accent-[var(--color-brand)]" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Mail className="h-3.5 w-3.5" /> Email them an invite link
                  </span>
                  <span className="block text-xs text-on-surface-variant">They choose their own password. Needs email sending set up in Supabase.</span>
                </span>
              </label>
              <label className={cn("flex cursor-pointer gap-3 border p-3", mode === "password" ? "border-on-surface bg-surface-container-low" : "border-outline-variant/50")}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "password"}
                  onChange={() => {
                    setMode("password");
                    if (!password) setPassword(makePassword());
                  }}
                  className="mt-1 accent-[var(--color-brand)]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <KeyRound className="h-3.5 w-3.5" /> Set a password now
                  </span>
                  <span className="block text-xs text-on-surface-variant">Works right away. You tell them the password.</span>
                </span>
              </label>
              {mode === "password" && (
                <div className="flex gap-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={10}
                    aria-label="Password"
                    className="h-11 rounded-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(makePassword())}
                    aria-label="Make a new password"
                    className="flex h-11 w-11 shrink-0 items-center justify-center border border-outline-variant/60 hover:border-on-surface-variant"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              )}
            </fieldset>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="min-h-10 rounded-none" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" className="min-h-10 rounded-none" disabled={pending || !fullName.trim() || !email.trim() || (mode === "password" && password.length < 10)}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "invite" ? "Send invite" : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordDialog({ member, onClose }: { member: StaffMember; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState(makePassword);
  const [saved, setSaved] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await setStaffPassword(member.id, password);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg font-bold uppercase tracking-[-0.02em]">
            New password for {member.fullName}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant">
            {saved ? "Saved. Give them the new password." : "Use this when someone forgot their password."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={10}
              readOnly={saved}
              aria-label="New password"
              className="h-11 rounded-none font-mono"
            />
            {!saved && (
              <button
                type="button"
                onClick={() => setPassword(makePassword())}
                aria-label="Make a new password"
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-outline-variant/60 hover:border-on-surface-variant"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
          <DialogFooter className="gap-2">
            {saved ? (
              <>
                <CopyButton
                  value={password}
                  label="Copy password"
                  toastMessage="Password copied"
                  className="min-h-10 border border-outline-variant/60 px-4 text-sm font-semibold"
                />
                <Button type="button" className="min-h-10 rounded-none" onClick={onClose}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" className="min-h-10 rounded-none" onClick={onClose} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" className="min-h-10 rounded-none" disabled={pending || password.length < 10}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save password
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
