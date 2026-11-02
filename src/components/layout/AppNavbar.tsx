"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { getNavigationItemsForRole, NavItem } from "@/lib/ui-state";
import { ThemeToggle } from "./ThemeToggle";

function NavIcon({ name }: { name: NavItem["iconName"] }) {
  switch (name) {
    case "dashboard":
      return <LayoutDashboard className="h-4 w-4" aria-hidden="true" />;
    case "rekap":
      return <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />;
    case "master":
      return <Settings className="h-4 w-4" aria-hidden="true" />;
    case "input":
      return <ClipboardCheck className="h-4 w-4" aria-hidden="true" />;
    case "riwayat":
      return <History className="h-4 w-4" aria-hidden="true" />;
  }
}

export function AppNavbar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const navItems = getNavigationItemsForRole(user.role);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-on-accent)]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold tracking-tight text-[var(--color-foreground)]">
              SIAGA-CCTV
            </span>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sistem Pemantauan & Rekap Harian
            </p>
          </div>
        </div>

        <nav
          aria-label="Navigasi Utama"
          className="flex flex-wrap items-center gap-1.5"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] font-semibold"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                }`}
              >
                <NavIcon name={item.iconName} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-right md:block">
            <div className="text-xs font-semibold text-[var(--color-foreground)]">
              {user.name}
            </div>
            <div className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
              {user.role}
            </div>
          </div>

          <ThemeToggle />

          <a
            href="/api/auth/signout"
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors duration-200 hover:bg-red-500/10 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Keluar</span>
          </a>
        </div>
      </div>
    </header>
  );
}
