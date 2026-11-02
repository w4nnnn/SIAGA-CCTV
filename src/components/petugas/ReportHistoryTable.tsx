"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Loader2,
  Save,
  X,
} from "lucide-react";
import {
  HistoryEditDraft,
  updateHistoryEditDraftStatus,
} from "@/lib/ui-state";
import { updateHistoricalReportAction } from "@/server/actions/report.actions";

export interface ReportHistoryItem {
  id: string;
  locationId: string;
  reportDate: string;
  displayName: string;
  status: "ON" | "OFF";
  notes: string | null;
}

export function ReportHistoryTable({
  items,
}: {
  items: ReportHistoryItem[];
}) {
  const router = useRouter();
  const [editingDraft, setEditingDraft] = useState<HistoryEditDraft | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startEdit = (item: ReportHistoryItem) => {
    setErrorMessage(null);
    setEditingDraft({
      reportId: item.id,
      status: item.status,
      notes: item.status === "OFF" ? (item.notes ?? "") : "",
    });
  };

  const handleSaveEdit = (reportId: string) => {
    if (!editingDraft) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateHistoricalReportAction(reportId, {
          status: editingDraft.status,
          notes: editingDraft.status === "OFF" ? editingDraft.notes : null,
        });
        setEditingDraft(null);
        router.refresh();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Gagal memperbarui laporan."
        );
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        Belum ada riwayat laporan yang tersimpan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-sm font-medium text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="px-4 py-3.5 font-semibold">Tanggal</th>
              <th className="px-4 py-3.5 font-semibold">Lokasi</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
              <th className="px-4 py-3.5 font-semibold">Catatan Kendala</th>
              <th className="px-4 py-3.5 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {items.map((item) => {
              const isEditing = editingDraft?.reportId === item.id;
              return (
                <tr key={item.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm">
                    {item.reportDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono font-semibold">
                    {item.displayName}
                  </td>
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDraft(
                              updateHistoryEditDraftStatus(editingDraft, "ON")
                            )
                          }
                          className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                            editingDraft.status === "ON"
                              ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                              : "border border-[var(--color-border)] bg-[var(--color-background)]"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>ON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingDraft(
                              updateHistoryEditDraftStatus(editingDraft, "OFF")
                            )
                          }
                          className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                            editingDraft.status === "OFF"
                              ? "bg-[var(--color-destructive)] text-white"
                              : "border border-[var(--color-border)] bg-[var(--color-background)]"
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ada Kendala / OFF</span>
                        </button>
                      </div>
                    ) : item.status === "ON" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ON</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ada Kendala / OFF</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      editingDraft.status === "OFF" ? (
                        <div>
                          <label
                            htmlFor={`edit-notes-${item.id}`}
                            className="sr-only"
                          >
                            Catatan Kendala
                          </label>
                          <input
                            id={`edit-notes-${item.id}`}
                            type="text"
                            value={editingDraft.notes}
                            onChange={(e) =>
                              setEditingDraft({
                                ...editingDraft,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Catatan kendala (opsional)"
                            className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
                          />
                        </div>
                      ) : (
                        <span className="text-xs italic text-[var(--color-muted-foreground)]">
                          Catatan otomatis dihapus karena status ON
                        </span>
                      )
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">
                        {item.notes ?? "-"}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveEdit(item.id)}
                          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-on-accent)]"
                        >
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Save className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDraft(null)}
                          className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Batal</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors duration-200 hover:bg-[var(--color-muted)]"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
