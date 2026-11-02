"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Loader2,
  Save,
} from "lucide-react";
import {
  applySelectAllOn,
  BatchFormRowState,
  createInitialBatchFormState,
  updateRowNotes,
  updateRowStatus,
} from "@/lib/ui-state";
import { submitBatchDailyReportsAction } from "@/server/actions/report.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LocationStatusProp {
  locationId: string;
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
}: {
  reportDate: string;
  initialLocations: LocationStatusProp[];
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

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate);
    router.push(`/petugas?date=${encodeURIComponent(nextDate)}`);
  };

  const handleSelectAllOn = () => {
    setRows((prev) => applySelectAllOn(prev));
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
        router.refresh();
      } catch (err) {
        setFeedback({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Gagal menyimpan laporan harian.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="report-date-input"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Calendar
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>Tanggal Laporan</span>
            </Label>
            <Input
              id="report-date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="min-h-[44px] w-auto font-mono text-sm"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleSelectAllOn}
            className="min-h-[44px] cursor-pointer gap-2 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            <span>Pilih Semua ON</span>
          </Button>
        </CardContent>
      </Card>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Akun Anda belum ditugaskan ke lokasi mana pun. Silakan hubungi
            Admin/SPV.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.locationId} className="transition-colors duration-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-mono text-base font-bold text-foreground">
                        {row.displayName}
                      </h2>
                      <Badge
                        variant={row.isAlreadyReported ? "default" : "secondary"}
                        className={
                          row.isAlreadyReported
                            ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                        }
                      >
                        {row.isAlreadyReported
                          ? "Sudah Tersimpan"
                          : "Belum Disimpan Hari Ini"}
                      </Badge>
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label={`Pilih status CCTV untuk ${row.displayName}`}
                    className="grid grid-cols-2 gap-2.5 sm:flex"
                  >
                    <Button
                      type="button"
                      variant={row.status === "ON" ? "default" : "outline"}
                      onClick={() => handleStatusChange(row.locationId, "ON")}
                      aria-pressed={row.status === "ON"}
                      className={`min-h-[44px] cursor-pointer gap-2 ${
                        row.status === "ON"
                          ? "bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                          : ""
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>ON</span>
                    </Button>

                    <Button
                      type="button"
                      variant={
                        row.status === "OFF" ? "destructive" : "outline"
                      }
                      onClick={() => handleStatusChange(row.locationId, "OFF")}
                      aria-pressed={row.status === "OFF"}
                      className={`min-h-[44px] cursor-pointer gap-2 ${
                        row.status === "OFF"
                          ? "bg-destructive font-semibold text-white hover:bg-destructive/90"
                          : ""
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      <span>Ada Kendala / OFF</span>
                    </Button>
                  </div>
                </div>

                {row.status === "OFF" && (
                  <div className="mt-4 border-t border-border pt-3">
                    <Label
                      htmlFor={`notes-${row.locationId}`}
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      Catatan Kendala {row.displayName} (Opsional)
                    </Label>
                    <Textarea
                      id={`notes-${row.locationId}`}
                      rows={2}
                      value={row.notes}
                      onChange={(e) =>
                        handleNotesChange(row.locationId, e.target.value)
                      }
                      placeholder="Contoh: Off 3 titik atau kamera area dermaga mati..."
                      className="focus-visible:ring-destructive"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="lg"
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
            className="min-h-[48px] w-full cursor-pointer gap-2 bg-emerald-600 px-6 py-3 text-base font-bold text-white shadow-md hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Menyimpan Laporan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" aria-hidden="true" />
                <span>Simpan Semua Laporan ({rows.length} Lokasi)</span>
              </>
            )}
          </Button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-lg font-bold">
              Konfirmasi Simpan Laporan Harian
            </AlertDialogTitle>
            <div className="space-y-3 text-sm text-muted-foreground pt-1">
              <p>
                Anda akan menyimpan laporan untuk{" "}
                <strong className="text-foreground">
                  {rows.length} lokasi
                </strong>{" "}
                pada tanggal{" "}
                <strong className="font-mono text-foreground">
                  {selectedDate}
                </strong>
                :
              </p>

              <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Status ON:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
                  <p className="text-xs font-semibold text-destructive">
                    Rincian Lokasi Berkendala:
                  </p>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-foreground">
                    {offRows.map((o) => (
                      <li key={o.locationId}>
                        <span className="font-mono font-medium">
                          {o.displayName}
                        </span>
                        {o.notes ? (
                          <span className="text-muted-foreground">
                            {" "}
                            — &quot;{o.notes}&quot;
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground">
                            {" "}
                            (tanpa catatan)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs">
                Apakah seluruh data laporan di atas sudah sesuai?
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isPending}>
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeSubmit}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {isPending ? "Menyimpan..." : "Ya, Simpan Laporan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
