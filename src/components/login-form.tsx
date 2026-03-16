"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginFormProps = {
  ownerEmail: string;
};

export function LoginForm({ ownerEmail }: LoginFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState(ownerEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submitLabel = mode === "sign-in" ? "Sign in" : "Create owner account";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        setMessage(
          error
            ? error.message
            : "Account created. Check your email if Supabase asks for confirmation, then sign in.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  const handleResetPassword = () => {
    if (!email) {
      setMessage("Enter your owner email first so I know where to send the reset link.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      setMessage(
        error
          ? error.message
          : "Password reset email sent. Open that link on this device to choose a new password.",
      );
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/74 p-6 shadow-[0_18px_60px_rgba(88,73,37,0.08)] backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.28em] text-moss">Owner access</p>
      <h1 className="mt-3 text-3xl font-semibold text-bark">Sign in to Nature Log</h1>
      <p className="mt-3 text-sm leading-6 text-ink/68">
        Public visitors can browse. Only the owner account can upload, edit, or delete entries.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={mode === "sign-up" && Boolean(ownerEmail)}
            className="mt-2 w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-base text-bark outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-bark/56">
            Password
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

        {message ? (
          <div className="rounded-[18px] border border-bark/10 bg-sand/30 px-4 py-3 text-sm text-bark/72">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[18px] bg-bark px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-paper transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending ? "Working..." : submitLabel}
        </button>

        {mode === "sign-in" ? (
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={pending}
            className="w-full rounded-[18px] border border-bark/10 bg-paper px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-bark transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
          >
            Forgot password?
          </button>
        ) : null}
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-ink/62">
        <span>{mode === "sign-in" ? "First time?" : "Already created it?"}</span>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setMode((current) => {
              const nextMode = current === "sign-in" ? "sign-up" : "sign-in";

              if (nextMode === "sign-up" && ownerEmail) {
                setEmail(ownerEmail);
              }

              return nextMode;
            });
          }}
          className="font-semibold text-moss"
        >
          {mode === "sign-in" ? "Create owner account" : "Back to sign in"}
        </button>
      </div>
    </div>
  );
}
