"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
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

export function LogoutConfirmButton({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const handleLogout = () => {
    toast.info("Mengakhiri sesi login...");
    window.location.href = "/api/auth/signout";
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
            Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem SIAGA-CCTV? Anda perlu login kembali untuk mengakses laporan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="cursor-pointer rounded-[0.25rem] bg-destructive text-xs font-heading font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            Ya, Keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
