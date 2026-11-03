"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import { formatIndonesianDateHeader } from "@/lib/format";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutConfirmButton } from "./LogoutConfirmButton";

export function TopBar({ user }: { user: SessionUser }) {
  const todayDateStr = React.useMemo(() => getTodayDateInJakarta(), []);
  const formattedDate = React.useMemo(
    () => formatIndonesianDateHeader(todayDateStr),
    [todayDateStr]
  );

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="cursor-pointer" />
        <div className="h-4 w-px bg-border hidden sm:block" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-heading text-xs font-semibold text-foreground sm:text-sm">
            {formattedDate}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            &bull; Operasional Terverifikasi
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-[0.25rem] border border-border bg-muted/40 px-2.5 py-1 md:flex">
          <Avatar className="size-6 rounded-[0.25rem]">
            <AvatarFallback className="rounded-[0.25rem] bg-secondary text-secondary-foreground font-heading text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-foreground">
              {user.name}
            </span>
            <span className="font-mono text-[10px] leading-tight text-muted-foreground">
              {user.role}
            </span>
          </div>
        </div>

        <ThemeToggle />

        <LogoutConfirmButton className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[0.25rem] border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" />
      </div>
    </header>
  );
}
