"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";
import {
  applySelectAllOff,
  applySelectAllOn,
  type BatchFormRowState,
  createInitialBatchFormState,
  getTodayDateInJakarta,
  updateRowNotes,
  updateRowStatus,
} from "@/lib/ui-state";
import { submitBatchDailyReportsAction } from "@/server/actions/report.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { CategoryBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LocationStatusProp {
  locationId: string;
  category?: string;
  name?: string;
  displayName: string;
  report: {
    id: string;
    status: "ON" | "OFF";
    notes: string | null;
  } | null;
}

export function BatchReportForm({
  reportDate,
  initialLocations,
  officerName = "Petugas Lapangan",
  officerRole = "PETUGAS",
}: {
  reportDate: string;
  initialLocations: LocationStatusProp[];
  officerName?: string;
  officerRole?: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(reportDate);
  const [rows, setRows] = useState<BatchFormRowState[]>(() =>
    createInitialBatchFormState(initialLocations)
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const todayStr = useMemo(() => getTodayDateInJakarta(), []);

  let sidebarOffset = "0px";
  try {
    const { isMobile, state } = useSidebar();
    if (!isMobile) {
      sidebarOffset =
        state === "collapsed"
          ? "var(--sidebar-width-icon, 3rem)"
          : "var(--sidebar-width, 16rem)";
    }
  } catch {
    // Graceful fallback when rendered without SidebarProvider
  }

  // Map category dari initialLocations
  const categoryByLocId = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of initialLocations) {
      if (l.category) map.set(l.locationId, l.category);
      else {
        const parts = l.displayName.split(" ");
        map.set(l.locationId, parts[0] || "LOC");
      }
    }
    return map;
  }, [initialLocations]);

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate);
    router.push(`/petugas?date=${encodeURIComponent(nextDate)}`);
  };

  const handleSelectAllOn = () => {
    setRows((prev) => applySelectAllOn(prev));
    setFeedback(null);
  };

  const handleSelectAllOff = () => {
    setRows((prev) => applySelectAllOff(prev));
    setFeedback(null);
  };

  const handleResetForm = () => {
    setRows(createInitialBatchFormState(initialLocations));
    setFeedback(null);
  };

  const handleStatusChange = (locationId: string, status: "ON" | "OFF") => {
    setRows((prev) => updateRowStatus(prev, locationId, status));
    setFeedback(null);
  };

  const handleNotesChange = (locationId: string, notes: string) => {
    setRows((prev) => updateRowNotes(prev, locationId, notes));
  };

  const onCount = rows.filter((r) => r.status === "ON").length;
  const offRows = rows.filter((r) => r.status === "OFF");

  const executeSubmit = () => {
    setConfirmOpen(false);
    setFeedback(null);

    startTransition(async () => {
      try {
        await submitBatchDailyReportsAction({
          reportDate: selectedDate,
          items: rows.map((r) => ({
            locationId: r.locationId,
            status: r.status,
            notes: r.status === "OFF" ? r.notes : null,
          })),
        });
        setRows((prev) =>
          prev.map((row) => ({ ...row, isAlreadyReported: true }))
        );
        setFeedback({
          type: "success",
          message: `Berhasil menyimpan laporan untuk ${rows.length} lokasi pada tanggal ${selectedDate}.`,
        });
        toast.success(`Laporan ${rows.length} lokasi berhasil disimpan!`);
        router.refresh();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan laporan harian.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    });
  };

  const scopePreview = useMemo(() => {
    if (rows.length === 0) return "Tidak ada lokasi penugasan";
    if (officerRole === "ADMIN") return "Semua Lokasi Aktif Terhubung";
    const names = rows.slice(0, 3).map((r) => r.displayName);
    const suffix = rows.length > 3 ? `, +${rows.length - 3} lainnya` : "";
    return `${names.join(", ")}${suffix}`;
  }, [rows, officerRole]);

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Banner Navy (Modern Industrial Enterprise) */}
      <div className="relative overflow-hidden rounded-[0.5rem] border border-border bg-gradient-to-r from-[#002244] via-[#003366] to-[#0b2d59] p-5 text-white shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold tracking-wider text-[#a7c8ff] uppercase">
                Telemetri Harian Petugas &bull; Penugasan Lapangan
              </span>
            </div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
              Input Laporan Status CCTV Harian
            </h1>
            <p className="text-xs text-white/80 max-w-2xl sm:text-sm">
              Laporkan status kesiapan kamera terminal Anda. Gunakan opsi cepat untuk memastikan pelaporan tuntas dalam hitungan detik.
            </p>
          </div>

          {/* Officer Profile Card Embedded */}
          <div className="flex items-center gap-3 rounded-[0.25rem] border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-white/20 text-white">
              <User className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-heading text-xs font-bold text-white sm:text-sm">
                  {officerName}
                </span>
                <span className="rounded-[0.25rem] bg-[var(--color-status-on-solid)] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white uppercase">
                  Aktif
                </span>
              </div>
              <span className="truncate text-[11px] text-white/70 max-w-[220px]">
                {scopePreview}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance Alert Callout */}
      <div className="flex items-start gap-3 rounded-[0.25rem] border border-border bg-card p-4 shadow-xs">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[0.25rem] bg-primary/10 text-primary">
          <Info className="size-4" />
        </div>
        <div className="flex-1 text-xs">
          <span className="font-heading font-bold text-foreground">
            Panduan Pelaporan Cepat:
          </span>{" "}
          <span className="text-muted-foreground">
            Klik tombol <strong className="text-foreground">&quot;Pilih Semua ON&quot;</strong> jika seluruh titik kamera beroperasi normal tanpa anomali. Bila terdapat kamera mati atau pemeliharaan, tandai <strong className="text-destructive">&quot;Ada Kendala / OFF&quot;</strong> pada lokasi terkait dan tambahkan catatan singkat.
          </span>
        </div>
      </div>

      {/* Global Batch Action Toolbar */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="report-date-input"
                className="flex items-center gap-1.5 font-heading text-xs font-semibold text-foreground"
              >
                <Calendar className="size-3.5 text-primary" aria-hidden="true" />
                <span>Tanggal Laporan:</span>
              </Label>
              <Input
                id="report-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-8 w-auto rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            {selectedDate === todayStr && (
              <span className="rounded-[0.25rem] border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                Hari Ini
              </span>
            )}

            <span className="text-xs text-muted-foreground">
              &bull; Scope: <strong className="font-mono text-foreground">{rows.length} Lokasi</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllOn}
              className="h-8 cursor-pointer gap-1.5 rounded-[0.25rem] border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)] hover:bg-[var(--color-status-on-surface)]/80 font-heading font-semibold text-xs"
            >
              <Check className="size-3.5" aria-hidden="true" />
              <span>✓✓ Pilih Semua ON</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllOff}
              className="h-8 cursor-pointer gap-1.5 rounded-[0.25rem] border-border text-muted-foreground hover:bg-muted hover:text-foreground font-heading text-xs"
            >
              <Wrench className="size-3.5" aria-hidden="true" />
              <span>Tandai Semua Kendala</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Alert */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2.5 rounded-[0.25rem] border p-3.5 text-xs font-medium",
            feedback.type === "success"
              ? "border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
              : "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Location Rows List */}
      {rows.length === 0 ? (
        <Card className="rounded-[0.5rem] border border-border bg-card">
          <CardContent className="p-8 text-center text-xs text-muted-foreground">
            Akun Anda belum ditugaskan ke lokasi mana pun. Silakan hubungi Admin/SPV untuk pengaturan master data.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const cat = categoryByLocId.get(row.locationId) ?? "LOC";
            const isOff = row.status === "OFF";

            return (
              <Card
                key={row.locationId}
                className={cn(
                  "rounded-[0.5rem] border bg-card transition-colors shadow-xs",
                  isOff
                    ? "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)]/20"
                    : "border-border"
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Location Info */}
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={cat} className="text-xs" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-heading text-sm font-bold text-foreground sm:text-base">
                            {row.displayName}
                          </h2>
                          <span
                            className={cn(
                              "rounded-[0.25rem] px-2 py-0.5 text-[10px] font-semibold",
                              row.isAlreadyReported
                                ? "border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
                                : "border border-border bg-muted/60 text-muted-foreground"
                            )}
                          >
                            {row.isAlreadyReported
                              ? "Sudah Tersimpan"
                              : "Belum Disimpan Hari Ini"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isOff ? "Status: Terdeteksi Kendala" : "Status: Normal Operasional"}
                        </p>
                      </div>
                    </div>

                    {/* Segmented Action Buttons */}
                    <div
                      role="group"
                      aria-label={`Pilih status CCTV untuk ${row.displayName}`}
                      className="grid grid-cols-2 gap-2 sm:flex sm:items-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleStatusChange(row.locationId, "ON")}
                        aria-pressed={row.status === "ON"}
                        className={cn(
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border px-3 text-xs font-heading font-semibold transition-colors cursor-pointer",
                          row.status === "ON"
                            ? "border-[var(--color-status-on-solid)] bg-[var(--color-status-on-solid)] text-white shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        <span>ON SEMUA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(row.locationId, "OFF")}
                        aria-pressed={isOff}
                        className={cn(
                          "inline-flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border px-3 text-xs font-heading font-semibold transition-colors cursor-pointer",
                          isOff
                            ? "border-[var(--color-status-off-solid)] bg-[var(--color-status-off-solid)] text-white shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                        <span>ADA KENDALA / OFF</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Notes Input */}
                  {isOff && (
                    <div className="mt-3.5 border-t border-[var(--color-status-off-border)] pt-3">
                      <Label
                        htmlFor={`notes-${row.locationId}`}
                        className="mb-1.5 block font-heading text-xs font-semibold text-[var(--color-status-off)]"
                      >
                        Catatan Kendala Lapangan:
                      </Label>
                      <Textarea
                        id={`notes-${row.locationId}`}
                        rows={2}
                        value={row.notes}
                        onChange={(e) =>
                          handleNotesChange(row.locationId, e.target.value)
                        }
                        placeholder="Tulis kendala (contoh: Off 3 titik kamera area dermaga, switch mati, dsb)..."
                        className="rounded-[0.25rem] border-[var(--color-status-off-border)] text-xs focus-visible:ring-[var(--color-status-off-solid)]"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Submit Bar */}
      {rows.length > 0 && (
        <aside
          aria-label="Aksi Simpan Laporan"
          style={{ left: sidebarOffset }}
          className="fixed bottom-0 right-0 z-20 border-t border-border bg-card/95 p-3 backdrop-blur-md shadow-lg transition-[left] duration-200 ease-linear"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[0.25rem] bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <span className="font-heading text-xs font-bold text-foreground">
                  Siap Dilaporkan ke Command Center
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Total {rows.length} lokasi &bull;{" "}
                  <strong className="text-[var(--color-status-on)]">{onCount} ON</strong>,{" "}
                  <strong className={offRows.length > 0 ? "text-destructive" : ""}>
                    {offRows.length} OFF
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                disabled={isPending}
                className="h-9 cursor-pointer gap-1.5 rounded-[0.25rem] border-border text-xs font-heading font-semibold"
              >
                <RefreshCw className="size-3.5" />
                <span>Reset Form</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
                className="h-9 cursor-pointer gap-2 rounded-[0.25rem] bg-primary px-4 font-heading text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    <span>Menyimpan Laporan...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" aria-hidden="true" />
                    <span>Simpan Semua Laporan ({rows.length} Lokasi)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Confirmation AlertDialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-foreground">
              Konfirmasi Simpan Laporan Harian
            </AlertDialogTitle>
            <div className="space-y-3 pt-1 text-xs text-muted-foreground">
              <p>
                Anda akan menyimpan status untuk{" "}
                <strong className="text-foreground">{rows.length} lokasi</strong> pada tanggal{" "}
                <strong className="font-mono text-foreground">{selectedDate}</strong>:
              </p>

              <div className="space-y-1.5 rounded-[0.25rem] border border-border bg-muted/50 p-3 text-xs">
                <div className="flex justify-between">
                  <span>Status ON:</span>
                  <span className="font-mono font-bold text-[var(--color-status-on)]">
                    {onCount} lokasi
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status Ada Kendala / OFF:</span>
                  <span className="font-mono font-bold text-destructive">
                    {offRows.length} lokasi
                  </span>
                </div>
              </div>

              {offRows.length > 0 && (
                <div className="space-y-1">
                  <p className="font-heading text-xs font-semibold text-destructive">
                    Rincian Lokasi Berkendala:
                  </p>
                  <ul className="max-h-36 list-disc space-y-1 overflow-y-auto pl-4 text-xs text-foreground">
                    {offRows.map((o) => (
                      <li key={o.locationId}>
                        <span className="font-semibold">{o.displayName}</span>
                        {o.notes ? (
                          <span className="text-muted-foreground"> — &quot;{o.notes}&quot;</span>
                        ) : (
                          <span className="italic text-muted-foreground"> (tanpa catatan)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[11px]">
                Data ini akan diperbarui di dashboard pemantauan pusat. Pastikan seluruh kondisi kamera sudah sesuai pengamatan di lapangan.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isPending}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeSubmit}
              className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Menyimpan..." : "Ya, Simpan Laporan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
