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
        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="font-mono text-2xl font-bold">
                  SIAGA-CCTV
                </CardTitle>
                <CardDescription className="text-xs">
                  Sistem Pelaporan &amp; Rekapitulasi CCTV
                </CardDescription>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Masuk untuk melapor kondisi kamera atau memantau rekap harian
            </p>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-sm font-medium text-destructive"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
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
                    placeholder="Contoh: petugas_jatim atau admin"
                    className="min-h-[44px] pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground"
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
                    placeholder="Masukkan password"
                    className="min-h-[44px] pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="min-h-[44px] w-full cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk ke Sistem</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center font-mono text-xs text-muted-foreground">
        SIAGA-CCTV &bull; Integrated Terminal &amp; Fuel Terminal Monitoring
      </footer>
    </div>
  );
}
