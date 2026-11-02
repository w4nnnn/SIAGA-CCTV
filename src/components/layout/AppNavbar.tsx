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
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

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
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold tracking-tight text-foreground">
              SIAGA-CCTV
            </span>
            <p className="text-xs text-muted-foreground">
              Sistem Pemantauan &amp; Rekap Harian
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
                className={cn(
                  buttonVariants({
                    variant: isActive ? "default" : "ghost",
                    size: "sm",
                  }),
                  "min-h-[44px] cursor-pointer gap-2",
                  isActive &&
                    "bg-emerald-600 text-white font-semibold hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                )}
              >
                <NavIcon name={item.iconName} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg border border-border bg-muted px-3 py-1.5 text-right md:block">
            <div className="text-xs font-semibold text-foreground">
              {user.name}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {user.role}
            </div>
          </div>

          <ThemeToggle />

          <a
            href="/api/auth/signout"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-[44px] cursor-pointer gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Keluar</span>
          </a>
        </div>
      </div>
    </header>
  );
}
