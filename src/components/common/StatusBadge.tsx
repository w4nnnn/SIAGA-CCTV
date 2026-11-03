import * as React from "react";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SemanticStatus = "ON" | "OFF" | "UNREPORTED" | "WARNING";

interface StatusBadgeProps {
  status: SemanticStatus;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  let displayLabel = label;
  let icon: React.ReactNode = null;
  let colorClasses = "";

  switch (status) {
    case "ON":
      displayLabel = displayLabel ?? "ON SEMUA";
      icon = <CheckCircle2 className="size-3.5" aria-hidden="true" />;
      colorClasses =
        "border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]";
      break;
    case "OFF":
      displayLabel = displayLabel ?? "ADA KENDALA / OFF";
      icon = <AlertTriangle className="size-3.5" aria-hidden="true" />;
      colorClasses =
        "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]";
      break;
    case "WARNING":
      displayLabel = displayLabel ?? "PERINGATAN";
      icon = <AlertTriangle className="size-3.5" aria-hidden="true" />;
      colorClasses =
        "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]";
      break;
    case "UNREPORTED":
    default:
      displayLabel = displayLabel ?? "BELUM LAPOR";
      icon = <Clock className="size-3.5" aria-hidden="true" />;
      colorClasses =
        "border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-surface)] text-[var(--color-status-pending)]";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[0.25rem] border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
        colorClasses,
        className
      )}
    >
      {showIcon && icon}
      <span>{displayLabel}</span>
    </span>
  );
}

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-muted-foreground",
        className
      )}
    >
      {category}
    </span>
  );
}
