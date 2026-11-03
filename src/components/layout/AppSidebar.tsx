"use client";

import * as React from "react";
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
import type { SessionUser } from "@/lib/auth";
import { getNavigationItemsForRole, type NavItem } from "@/lib/ui-state";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutConfirmButton } from "./LogoutConfirmButton";

function iconFor(iconName: NavItem["iconName"]) {
  switch (iconName) {
    case "dashboard":
      return <LayoutDashboard className="size-4" aria-hidden="true" />;
    case "input":
      return <ClipboardCheck className="size-4" aria-hidden="true" />;
    case "riwayat":
      return <History className="size-4" aria-hidden="true" />;
    case "rekap":
      return <FileSpreadsheet className="size-4" aria-hidden="true" />;
    case "master":
      return <Settings className="size-4" aria-hidden="true" />;
  }
}

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const navItems = getNavigationItemsForRole(user.role);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
              SIAGA-CCTV
            </span>
            <span className="truncate text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Operational Surveillance
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
            Menu Operasional
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    item.href !== "/petugas" &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "bg-primary font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      {iconFor(item.iconName)}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:hidden">
            <Avatar className="size-8 rounded-[0.25rem]">
              <AvatarFallback className="rounded-[0.25rem] bg-secondary text-secondary-foreground font-heading text-xs font-bold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-sidebar-foreground">
                {user.name}
              </span>
              <span className="truncate text-[10px] font-mono text-muted-foreground">
                {user.role}
              </span>
            </div>
          </div>

          <LogoutConfirmButton className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[0.25rem] border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" />
        </div>

        <SidebarSeparator className="my-1 group-data-[collapsible=icon]:hidden" />

        <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full bg-[var(--color-status-on-solid)]"
              aria-hidden="true"
            />
            <span>Sistem Normal</span>
          </div>
          <span className="font-mono text-[10px]">v2.4</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
