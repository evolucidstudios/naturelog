"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        setReady(true);
        return;
      }

      setMessage("Open this page from the password reset email so we can verify your session.");
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setMessage(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match yet.");
      return;
    }

    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password updated. Sending you back to the admin.");
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/74 p-6 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.28em] text-moss">Owner recovery</p>
      <h1 className="mt-3 text-3xl font-semibold text-bark">Set a new password</h1>
      <p className="mt-3 text-sm leading-6 text-ink/68">
        Use the link from your email, then choose a new owner password here.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            New password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Confirm password
          </span>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>

        {message ? (
          <div className="rounded-[18px] border border-bark/10 bg-sand/30 px-4 py-3 text-sm text-bark/72">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!ready || pending}
          className="w-full rounded-[18px] bg-bark px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-paper transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Updating..." : "Save new password"}
        </button>
      </form>
    </div>
  );
}
