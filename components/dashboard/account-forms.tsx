"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeMyPassword, updateMyName } from "@/app/actions/staff";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const submit =
  "inline-flex min-h-10 items-center gap-2 bg-on-surface px-5 font-headline text-[11px] font-bold uppercase tracking-[0.1em] text-surface transition-opacity disabled:opacity-40";

export function AccountForms({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingName, startName] = useTransition();
  const [savingPw, startPw] = useTransition();

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    startName(async () => {
      const result = await updateMyName(name);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Name updated");
        router.refresh();
      }
    });
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    startPw(async () => {
      const result = await changeMyPassword(password, confirm);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Password changed");
        setPassword("");
        setConfirm("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveName} className="space-y-4 bg-surface-container-low p-5">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">Display name</h2>
        <p className="text-sm text-on-surface-variant">
          Shown on the activity log, payment ledger and job assignments.
        </p>
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>
        <button type="submit" className={submit} disabled={savingName || name.trim() === fullName}>
          {savingName && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save name
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 bg-surface-container-low p-5">
        <h2 className="font-headline text-sm font-bold uppercase tracking-[0.04em]">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-on-surface-variant">At least 10 characters.</p>
        <button type="submit" className={submit} disabled={savingPw || !password || !confirm}>
          {savingPw && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Change password
        </button>
      </form>
    </div>
  );
}
