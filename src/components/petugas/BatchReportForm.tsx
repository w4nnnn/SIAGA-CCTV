"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Database,
  Info,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
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

  // Map category & name dari initialLocations
  const metaByLocId = useMemo(() => {
    const map = new Map<string, { category: string; name: string }>();
    for (const l of initialLocations) {
      const category = l.category || l.displayName.split(" ")[0] || "LOC";
      const name =
        l.name ||
        (l.displayName.startsWith(category + " ")
          ? l.displayName.slice(category.length + 1)
          : l.displayName);
      map.set(l.locationId, { category, name });
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

  return (
    <div className="space-y-4">
      {/* Page Title & Breadcrumb Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-[0.25rem] bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tracking-wider uppercase">
            Input Telemetri Harian
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            &bull; Shift Operasional Lapangan
          </span>
        </div>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Input Laporan Status CCTV Harian
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Laporkan status kesiapan kamera CCTV seluruh terminal penugasan Anda untuk tanggal aktif.
        </p>
      </div>

      {/* Guidance Alert Callout */}
      <div className="flex items-center gap-2.5 rounded-[0.25rem] border border-border bg-card px-3.5 py-2 text-xs shadow-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" />
        <span>
          <strong className="text-foreground">Panduan Cepat:</strong> Klik <strong className="text-foreground">&quot;Pilih Semua ON&quot;</strong> jika seluruh titik kamera normal, atau tandai <strong className="text-destructive">&quot;Ada Kendala / OFF&quot;</strong> untuk mengisi catatan kendala lapangan.
        </span>
      </div>

      {/* Global Batch Action Toolbar */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
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
        <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 sm:px-4 py-2 text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Daftar Terminal ({rows.length} Lokasi)</span>
            <span>Status Kesiapan Kamera</span>
          </div>
          <div className="divide-y divide-border/70">
            {rows.map((row) => {
              const meta = metaByLocId.get(row.locationId);
              const cat = meta?.category ?? "LOC";
              const placeName = meta?.name ?? row.displayName;
              const isOff = row.status === "OFF";

              return (
                <div
                  key={row.locationId}
                  className={cn(
                    "p-3 sm:px-4 sm:py-2.5 transition-colors",
                    isOff
                      ? "bg-[var(--color-status-off-surface)]/25"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Location Info */}
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={cat} className="text-[10px] shrink-0" />
                      <span className="font-heading text-xs sm:text-sm font-bold text-foreground">
                        {placeName}
                      </span>
                      <span
                        className={cn(
                          "rounded-[0.25rem] px-1.5 py-0.5 text-[9px] font-semibold shrink-0 uppercase tracking-wide",
                          row.isAlreadyReported
                            ? "border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
                            : "border border-border bg-muted/60 text-muted-foreground"
                        )}
                      >
                        {row.isAlreadyReported ? "Tersimpan" : "Belum Simpan"}
                      </span>
                    </div>

                    {/* Segmented Action Buttons */}
                    <div
                      role="group"
                      aria-label={`Pilih status CCTV untuk ${row.displayName}`}
                      className="flex items-center gap-1.5 shrink-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleStatusChange(row.locationId, "ON")}
                        aria-pressed={row.status === "ON"}
                        className={cn(
                          "inline-flex h-8 items-center justify-center gap-1.5 rounded-[0.25rem] border px-3 text-xs font-heading font-semibold transition-colors cursor-pointer",
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
                          "inline-flex h-8 items-center justify-center gap-1.5 rounded-[0.25rem] border px-3 text-xs font-heading font-semibold transition-colors cursor-pointer",
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

                  {/* Conditional Compact Note Input */}
                  {isOff && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--color-status-off-border)]/60">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label
                          htmlFor={`notes-${row.locationId}`}
                          className="text-[11px] font-heading font-semibold text-[var(--color-status-off)] shrink-0"
                        >
                          Catatan Kendala:
                        </Label>
                        <Input
                          id={`notes-${row.locationId}`}
                          type="text"
                          value={row.notes}
                          onChange={(e) =>
                            handleNotesChange(row.locationId, e.target.value)
                          }
                          placeholder="Tuliskan kendala spesifik (contoh: Off 3 titik kamera area dermaga, switch mati)..."
                          className="h-8 text-xs rounded-[0.25rem] border-[var(--color-status-off-border)] focus-visible:ring-[var(--color-status-off-solid)]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-3.5 sm:px-4 py-2 text-xs text-muted-foreground">
            <span>Kepatuhan shift: Seluruh terminal siap dilaporkan</span>
            <span className="font-mono text-[11px] font-semibold text-foreground">
              {onCount} Normal &bull; {offRows.length} Kendala
            </span>
          </div>
        </Card>
      )}

      {/* Diagnostic & Telemetry Status Cards (Matching reference) */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="rounded-[0.5rem] border border-border bg-card p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-secondary text-secondary-foreground font-heading text-xs font-bold">
                {Math.round((onCount / Math.max(1, rows.length)) * 100)}%
              </div>
              <div>
                <span className="font-heading text-xs font-bold text-foreground">
                  Indeks Kesiapan Unit
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {onCount} Normal &bull; {offRows.length} Berkendala
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[0.5rem] border border-border bg-card p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-4 text-[var(--color-status-on)]" />
              </div>
              <div>
                <span className="font-heading text-xs font-bold text-foreground">
                  Integritas Observasi
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Audit Mutasi Real-time Pertamina
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[0.5rem] border border-border bg-card p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-[0.25rem] bg-secondary text-secondary-foreground">
                <Database className="size-4 text-primary" />
              </div>
              <div>
                <span className="font-heading text-xs font-bold text-foreground">
                  Mode Penyimpanan
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Atomic Batch Upsert Harian
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      {rows.length > 0 && (
        <Card className="rounded-[0.5rem] border border-border bg-card p-3 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-fit">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[0.25rem] bg-primary text-primary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-xs font-bold text-foreground whitespace-nowrap">
                  Siap Dilaporkan ke Command Center
                </span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  Total {rows.length} lokasi &bull;{" "}
                  <strong className="text-[var(--color-status-on)]">{onCount} ON</strong>,{" "}
                  <strong className={offRows.length > 0 ? "text-destructive" : ""}>
                    {offRows.length} OFF
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetForm}
                disabled={isPending}
                className="h-8 cursor-pointer gap-1.5 rounded-[0.25rem] border-border text-xs font-heading font-semibold"
              >
                <RefreshCw className="size-3.5" />
                <span>Reset Form</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
                className="h-8 cursor-pointer gap-2 rounded-[0.25rem] bg-primary px-3.5 font-heading text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
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
        </Card>
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
