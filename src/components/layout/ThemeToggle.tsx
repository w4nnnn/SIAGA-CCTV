"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveInitialTheme } from "@/lib/ui-state";

const THEME_STORAGE_KEY = "siaga-cctv-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initial = resolveInitialTheme(saved, prefersDark);
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
      }
      title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      className="min-h-[44px] min-w-[44px] cursor-pointer gap-2"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span className="hidden sm:inline">Terang</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-slate-700" aria-hidden="true" />
          <span className="hidden sm:inline">Gelap</span>
        </>
      )}
    </Button>
  );
}
