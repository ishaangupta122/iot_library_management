"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LibraryBig, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { DEMO_CREDENTIALS, useAuth } from "@/context/AuthContext";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, ready, isDemo, signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" | "reset" | "sent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/admin");
  }, [ready, user, router]);

  const run = async (task) => {
    setBusy(true);
    setError("");
    const result = await task();
    setBusy(false);
    if (!result.ok && result.error) setError(result.error);
    return result;
  };

  const submitSignIn = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Enter your email and password.");
    run(() => signInWithEmail(email, password));
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    const result = await run(() => resetPassword(email));
    if (result.ok) setMode("sent");
  };

  return (
    <main className="tight-corners flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-white"><LibraryBig className="h-8 w-8" aria-hidden="true" /></span>
        <div>
          <h1 className="font-display text-4xl leading-[0.9] font-semibold tracking-tight">SmartLib</h1>
          <p className="mt-1.5 text-sm leading-none text-muted">Admin sign in</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
        {mode === "signin" && (
          <>
            <Button variant="secondary" className="w-full justify-center" onClick={() => run(signInWithGoogle)} disabled={busy}>
              <GoogleMark /> Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
            </div>
            <form onSubmit={submitSignIn} noValidate className="space-y-4">
              <Field label="Email">{(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />}</Field>
              <Field label="Password">
                {(p) => (
                  <div className="relative">
                    <Input {...p} type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-11" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-ink">
                      {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                    </button>
                  </div>
                )}
              </Field>
              {error && <p role="alert" className="text-sm font-medium text-brand-700">{error}</p>}
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
            <button type="button" onClick={() => { setMode("reset"); setError(""); }} className="mt-4 w-full text-center text-sm font-medium text-brand-700 hover:underline">Forgot password?</button>
          </>
        )}

        {mode === "reset" && (
          <form onSubmit={submitReset} noValidate className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-medium">Reset your password</h2>
              <p className="mt-1 text-sm text-muted">Enter your account email and we'll send you a link to choose a new password.</p>
            </div>
            <Field label="Email">{(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />}</Field>
            {error && <p role="alert" className="text-sm font-medium text-brand-700">{error}</p>}
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
            <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft size={15} aria-hidden="true" /> Back to sign in</button>
          </form>
        )}

        {mode === "sent" && (
          <div className="text-center">
            <MailCheck size={40} aria-hidden="true" className="mx-auto text-ok-700" />
            <h2 className="mt-3 font-display text-xl font-medium">Check your email</h2>
            <p className="mt-2 text-sm text-muted">
              {isDemo ? "Demo mode: no email is sent. With Firebase connected," : "If an account exists for"} <strong className="text-ink">{email.trim()}</strong>{isDemo ? " would receive a link to set a new password." : ", we've sent a link to set a new password."}
            </p>
            <Button className="mt-5 w-full justify-center" onClick={() => { setMode("signin"); setPassword(""); }}>Back to sign in</Button>
          </div>
        )}
      </div>

      {isDemo && (
        <p className="mt-5 max-w-sm rounded-lg border border-warn-100 bg-warn-50 px-4 py-3 text-center text-[13px] leading-relaxed text-warn-700">
          Demo mode: Firebase isn't connected yet. Sign in with <strong>{DEMO_CREDENTIALS.email}</strong> and password <strong>{DEMO_CREDENTIALS.password}</strong>, or use Google to continue as the demo admin.
        </p>
      )}
    </main>
  );
}
