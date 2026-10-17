"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Stage = "checking" | "ready" | "saving" | "error";

/**
 * Landing page for invite and password-reset emails. Supabase's default
 * email links put the session in the URL hash; custom templates can send
 * ?token_hash=…&type=…. Either way we end up signed in and ask for a password.
 */
export default function WelcomePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("checking");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);

    async function establish() {
      const error = hash.get("error_description") ?? query.get("error_description");
      if (error) {
        throw new Error(
          /expired|invalid/i.test(error)
            ? "This link has expired or was already used. Ask the admin for a new invite or password."
            : error,
        );
      }
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const tokenHash = query.get("token_hash");
      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (e) throw e;
      } else if (tokenHash) {
        const { error: e } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (query.get("type") as EmailOtpType) ?? "invite",
        });
        if (e) throw e;
      }
      // Drop the tokens from the address bar.
      window.history.replaceState(null, "", "/welcome");
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("This link has expired or was already used. Ask the admin for a new invite.");
      setEmail(data.user.email ?? "");
      setStage("ready");
    }

    establish().catch((e: Error) => {
      setMessage(e.message);
      setStage("error");
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 10) return setMessage("Use at least 10 characters.");
    if (password !== confirm) return setMessage("The two passwords don't match.");
    setStage("saving");
    setMessage("");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setStage("ready");
      return;
    }
    router.replace("/dashboard");
  }

  const field =
    "w-full min-h-12 border border-outline-variant/60 bg-surface-container-lowest px-3 text-base outline-none focus:border-on-surface-variant";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-6 bg-surface-container-low p-6 md:p-8">
        <div>
          <p className="spec mb-2 text-[11px] text-accent-ink">Art &apos;n Me · Staff portal</p>
          <h1 className="font-headline text-3xl font-bold uppercase leading-none tracking-[-0.04em]">Welcome</h1>
        </div>

        {stage === "checking" && (
          <p className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your link…
          </p>
        )}

        {stage === "error" && (
          <div className="space-y-4">
            <p role="alert" className="border border-brand bg-brand/10 px-4 py-3 text-sm">
              {message}
            </p>
            <a href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline">
              Go to sign in →
            </a>
          </div>
        )}

        {(stage === "ready" || stage === "saving") && (
          <form onSubmit={save} className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Choose a password for <span className="font-semibold text-on-surface">{email}</span>. You&apos;ll use it
              with your email to sign in.
            </p>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Type it again</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={field}
              />
            </label>
            <p className="text-xs text-on-surface-variant">At least 10 characters.</p>
            {message && (
              <p role="alert" className="text-sm font-medium text-accent-ink">
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={stage === "saving"}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-brand font-headline text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60"
            >
              {stage === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Save password &amp; open the portal
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
