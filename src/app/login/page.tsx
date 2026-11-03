"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      setErrorMessage(
        "Gagal menghubungi server autentikasi. Silakan coba lagi."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background p-4 sm:p-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="mx-auto w-full max-w-md">
        <Card className="rounded-[0.5rem] border border-border bg-card shadow-sm">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[0.25rem] bg-primary text-primary-foreground shadow-xs">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="font-heading text-xl font-bold tracking-tight text-foreground">
                  SIAGA-CCTV
                </CardTitle>
                <CardDescription className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                  Operational Surveillance Portal
                </CardDescription>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Masuk untuk melaporkan kondisi CCTV harian atau memantau telemetri seluruh lokasi.
            </p>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-[0.25rem] border border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] p-3 text-xs font-medium text-[var(--color-status-off)]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                  Username Akun
                </Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="petugas_jatim / admin"
                    className="h-9 rounded-[0.25rem] pl-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 rounded-[0.25rem] pl-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full cursor-pointer gap-2 rounded-[0.25rem] bg-primary font-heading font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <span>Masuk ke Dashboard</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center font-mono text-[11px] text-muted-foreground">
        SIAGA-CCTV &bull; Integrated &amp; Fuel Terminal Operational Telemetry
      </footer>
    </div>
  );
}
