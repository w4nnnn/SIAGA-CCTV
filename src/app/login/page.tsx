"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          csrfToken,
          username: username.trim(),
          password,
          json: "true",
        }),
      });

      if (!res.ok) {
        setErrorMessage("Username atau password tidak sesuai.");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.url && String(data.url).includes("error")) {
        setErrorMessage("Username atau password tidak sesuai.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Gagal menghubungi server autentikasi. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[var(--color-background)] p-4 sm:p-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="mx-auto w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
              SIAGA-CCTV
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Masuk untuk melapor atau memantau rekap CCTV
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-sm font-medium text-red-600 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
            >
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-muted-foreground)]"
                aria-hidden="true"
              />
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: petugas_jatim atau admin"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-muted-foreground)]"
                aria-hidden="true"
              />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Masuk ke Sistem</span>
            )}
          </button>
        </form>
      </main>

      <footer className="text-center font-mono text-xs text-[var(--color-muted-foreground)]">
        SIAGA-CCTV &bull; Integrated Terminal &amp; Fuel Terminal Monitoring
      </footer>
    </div>
  );
}
