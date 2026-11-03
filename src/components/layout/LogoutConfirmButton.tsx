"use client";

import * as React from "react";
import { LogOut, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { logoutAction } from "@/server/actions/auth.actions";

export function LogoutConfirmButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleLogout = () => {
    toast.info("Mengakhiri sesi dan keluar...");
    startTransition(async () => {
      try {
        await logoutAction();
      } catch {
        // Fallback jika redirect NextAuth
        window.location.href = "/login";
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            title="Keluar"
            aria-label="Keluar dari sistem"
            className={className}
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        }
      />
      <AlertDialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-base font-bold text-foreground">
            Konfirmasi Keluar Sistem
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem SIAGA-CCTV? Anda akan diarahkan langsung ke halaman login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleLogout}
            className="cursor-pointer gap-2 rounded-[0.25rem] bg-destructive text-xs font-heading font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span>Keluar...</span>
              </>
            ) : (
              <span>Ya, Keluar</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
