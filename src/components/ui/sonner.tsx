"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, Info, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-4 shrink-0 text-[var(--color-status-on-solid)]" />,
        info: <Info className="size-4 shrink-0 text-primary" />,
        warning: <AlertTriangle className="size-4 shrink-0 text-[var(--color-status-warning-solid)]" />,
        error: <AlertCircle className="size-4 shrink-0 text-[var(--color-status-off-solid)]" />,
        loading: <Loader2 className="size-4 shrink-0 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans text-xs font-medium rounded-[0.375rem] shadow-xl p-3.5 flex items-center gap-2.5 border bg-card text-foreground ring-1 ring-border/80 dark:bg-[#182338] dark:text-white dark:border-[#2e4063]",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground font-semibold px-2 py-1 rounded-[0.25rem]",
          cancelButton: "bg-muted text-muted-foreground font-semibold px-2 py-1 rounded-[0.25rem]",
          success: "border-[var(--color-status-on-border)] text-foreground dark:border-emerald-500/60",
          error: "border-[var(--color-status-off-border)] text-foreground dark:border-rose-500/60",
          warning: "border-[var(--color-status-warning-border)] text-foreground dark:border-amber-500/60",
          info: "border-border text-foreground dark:border-blue-500/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
