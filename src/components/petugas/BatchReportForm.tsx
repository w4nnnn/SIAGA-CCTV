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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5">
        <div>
          <label
            htmlFor="report-date-input"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]"
          >
            <Calendar className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            <span>Tanggal Laporan</span>
          </label>
          <input
            id="report-date-input"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 font-mono text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          />
        </div>

        <button
          type="button"
          onClick={handleSelectAllOn}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-accent)] bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] dark:text-emerald-300"
        >
          <CheckSquare className="h-4 w-4" aria-hidden="true" />
          <span>Pilih Semua ON</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Akun Anda belum ditugaskan ke lokasi mana pun. Silakan hubungi Admin/SPV.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.locationId}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-colors duration-200 sm:p-5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-mono text-base font-bold text-[var(--color-foreground)]">
                      {row.displayName}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.isAlreadyReported
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {row.isAlreadyReported
                        ? "Sudah Tersimpan"
                        : "Belum Disimpan Hari Ini"}
                    </span>
                  </div>
                </div>

                <div
                  role="group"
                  aria-label={`Pilih status CCTV untuk ${row.displayName}`}
                  className="grid grid-cols-2 gap-2.5 sm:flex"
                >
                  <button
                    type="button"
                    onClick={() => handleStatusChange(row.locationId, "ON")}
                    aria-pressed={row.status === "ON"}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      row.status === "ON"
                        ? "bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-sm"
                        : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>ON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(row.locationId, "OFF")}
                    aria-pressed={row.status === "OFF"}
                    className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                      row.status === "OFF"
                        ? "bg-[var(--color-destructive)] text-white shadow-sm"
                        : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>Ada Kendala / OFF</span>
                  </button>
                </div>
              </div>

              {row.status === "OFF" && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                  <label
                    htmlFor={`notes-${row.locationId}`}
                    className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]"
                  >
                    Catatan Kendala {row.displayName} (Opsional)
                  </label>
                  <textarea
                    id={`notes-${row.locationId}`}
                    rows={2}
                    value={row.notes}
                    onChange={(e) =>
                      handleNotesChange(row.locationId, e.target.value)
                    }
                    placeholder="Contoh: Off 3 titik atau kamera area dermaga mati..."
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-foreground)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3 text-base font-bold text-[var(--color-on-accent)] shadow-md transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
          </button>
        </div>
      )}
    </form>
  );
}
