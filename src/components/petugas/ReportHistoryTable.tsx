"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit3,
  Filter,
  History,
  Loader2,
  RotateCcw,
  Save,
  User,
  Video,
} from "lucide-react";
import {
  type HistoryEditDraft,
  updateHistoryEditDraftStatus,
} from "@/lib/ui-state";
import { paginate } from "@/lib/view-models";
import { updateHistoricalReportAction } from "@/server/actions/report.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CategoryBadge, StatusBadge } from "@/components/common/StatusBadge";
import { SimpleSelect } from "@/components/common/SimpleSelect";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ReportHistoryItem {
  id: string;
  locationId: string;
  reportDate: string;
  displayName: string;
  category?: string;
  name?: string;
  status: "ON" | "OFF";
  notes: string | null;
  updatedAt?: Date | null;
  reporterName?: string | null;
}

export function ReportHistoryTable({
  items,
}: {
  items: ReportHistoryItem[];
}) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<ReportHistoryItem | null>(null);
  const [editingDraft, setEditingDraft] = useState<HistoryEditDraft | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter states
  const [filterLocationId, setFilterLocationId] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Options untuk lokasi
  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(item.locationId, item.displayName);
    }
    return [
      { value: "ALL", label: "Semua Lokasi Penugasan" },
      ...Array.from(map.entries())
        .map(([id, name]) => ({ value: id, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [items]);

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "ON", label: "Normal (ON)" },
    { value: "OFF", label: "Ada Kendala (OFF)" },
  ];

  // Hitung KPI
  const totalCount = items.length;
  const normalCount = items.filter((i) => i.status === "ON").length;
  const incidentCount = items.filter((i) => i.status === "OFF").length;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterLocationId !== "ALL" && item.locationId !== filterLocationId) {
        return false;
      }
      if (filterStatus !== "ALL" && item.status !== filterStatus) {
        return false;
      }
      if (filterStartDate && item.reportDate < filterStartDate) {
        return false;
      }
      if (filterEndDate && item.reportDate > filterEndDate) {
        return false;
      }
      return true;
    });
  }, [items, filterLocationId, filterStatus, filterStartDate, filterEndDate]);

  const paginated = useMemo(
    () => paginate(filteredItems, page, pageSize),
    [filteredItems, page, pageSize]
  );

  const handleResetFilter = () => {
    setFilterLocationId("ALL");
    setFilterStatus("ALL");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const openEditDialog = (item: ReportHistoryItem) => {
    setErrorMessage(null);
    setEditingItem(item);
    setEditingDraft({
      reportId: item.id,
      status: item.status,
      notes: item.status === "OFF" ? (item.notes ?? "") : "",
    });
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setEditingDraft(null);
    setErrorMessage(null);
  };

  const handleSaveEdit = () => {
    if (!editingDraft) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await updateHistoricalReportAction(editingDraft.reportId, {
          status: editingDraft.status,
          notes: editingDraft.status === "OFF" ? editingDraft.notes : null,
        });
        closeEditDialog();
        toast.success(`Data laporan ${editingItem?.displayName ?? ""} berhasil diperbarui.`);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal memperbarui laporan.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-[0.25rem] bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tracking-wider uppercase">
            Modul Verifikasi &amp; Audit
          </span>
        </div>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Riwayat &amp; Perbaikan Laporan CCTV
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Periksa riwayat observasi harian, audit status kepatuhan, dan perbarui data jika terdapat perbaikan titik kamera.
        </p>
      </div>

      {/* KPI 3-Card Summary Grid */}
      <section
        aria-label="Ringkasan Riwayat Log"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Card className="rounded-[0.5rem] border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Log Tercatat
            </span>
            <ClipboardList className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {totalCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Data
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Arsip Lapangan
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-on-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-on)]">
              Tervalidasi / Normal
            </span>
            <CheckCircle2 className="size-4 text-[var(--color-status-on)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-[var(--color-status-on)] sm:text-3xl">
              {normalCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Normal
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              {totalCount > 0 ? Math.round((normalCount / totalCount) * 100) : 0}% Uptime
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-off-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-off)]">
              Kendala / OFF-Line
            </span>
            <AlertTriangle className="size-4 text-[var(--color-status-off)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-[var(--color-status-off)] sm:text-3xl">
              {incidentCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Titik
              </span>
            </div>
            <span
              className={cn(
                "rounded-[0.25rem] border px-2 py-0.5 text-[11px] font-semibold",
                incidentCount > 0
                  ? "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]"
                  : "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {incidentCount > 0 ? "Pernah Berkendala" : "Nihil Anomali"}
            </span>
          </div>
        </Card>
      </section>

      {/* Filter Toolbar Card */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lokasi Penugasan
              </Label>
              <SimpleSelect
                value={filterLocationId}
                onValueChange={(val) => {
                  setFilterLocationId(val);
                  setPage(1);
                }}
                options={locationOptions}
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Toleransi
              </Label>
              <SimpleSelect
                value={filterStatus}
                onValueChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                options={statusOptions}
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dari Tanggal
              </Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sampai Tanggal
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-[0.25rem] font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleResetFilter}
                  title="Reset Filter"
                  aria-label="Reset Filter"
                  className="size-9 shrink-0 cursor-pointer rounded-[0.25rem]"
                >
                  <RotateCcw className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[0.25rem] border border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] p-3.5 text-xs font-medium text-[var(--color-status-off)]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Individual History Cards List */}
      {paginated.items.length === 0 ? (
        <Card className="rounded-[0.5rem] border border-border bg-card">
          <CardContent className="p-8 text-center text-xs text-muted-foreground">
            Tidak ada catatan riwayat laporan yang cocok dengan kriteria filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paginated.items.map((item) => {
            const placeName =
              item.name ||
              (item.category && item.displayName.startsWith(item.category + " ")
                ? item.displayName.slice(item.category.length + 1)
                : item.displayName);
            const isOff = item.status === "OFF";

            return (
              <Card
                key={item.id}
                className={cn(
                  "rounded-[0.5rem] border p-3.5 sm:p-4 shadow-xs transition-colors",
                  isOff
                    ? "border-[var(--color-status-off-border)]/80 bg-[var(--color-status-off-surface)]/20"
                    : "border-border bg-card hover:border-border/80"
                )}
              >
                {/* Header Row: Station Avatar, Name, Status, Date & Koreksi Action */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[0.25rem] border border-border/50 bg-secondary font-mono text-xs font-bold text-primary">
                      {item.category ?? "LOC"}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-bold text-foreground sm:text-base">
                          {placeName}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-primary" /> {item.reportDate}
                        </span>
                        <span>&bull;</span>
                        <span className="text-[11px] font-sans">Shift Harian Lapangan</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                    className="h-8 gap-1.5 rounded-[0.25rem] border-border text-xs font-heading font-semibold hover:bg-muted cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Edit3 className="size-3.5" aria-hidden="true" />
                    <span>Koreksi Laporan</span>
                  </Button>
                </div>

                {/* Observation / Notes Block */}
                <div className="mt-3">
                  {!isOff ? (
                    <div className="flex items-center gap-2 rounded-[0.25rem] bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-[var(--color-status-on)] shrink-0" />
                      <span>
                        {item.notes && item.notes.trim().length > 0
                          ? item.notes
                          : "Semua kamera beroperasi normal tanpa kendala titik telemetri."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-[0.25rem] border border-[var(--color-status-off-border)]/60 bg-[var(--color-status-off-surface)]/50 px-3 py-2 text-xs text-[var(--color-status-off)]">
                      <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block text-[11px] uppercase tracking-wider">
                          Catatan Kendala Lapangan:
                        </strong>
                        <span className="text-xs">
                          {item.notes && item.notes.trim().length > 0
                            ? item.notes
                            : "Terdapat kendala titik kamera lapangan."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Meta Footer */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3 text-muted-foreground" />
                    <span>
                      Pelapor: <strong className="text-foreground">{item.reporterName ?? "Petugas Lapangan"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>
                      {item.updatedAt
                        ? `Pembaruan: ${new Date(item.updatedAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} WIB`
                        : "Tersimpan pada shift operasional"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination Card */}
          <Card className="rounded-[0.5rem] border border-border bg-card p-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Menampilkan {paginated.items.length} dari {filteredItems.length} Data Laporan
              </span>

              {paginated.totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={paginated.page <= 1}
                    className="size-7 rounded-[0.25rem] cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>

                  <span className="font-mono text-xs font-semibold px-2">
                    {paginated.page} / {paginated.totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
                    disabled={paginated.page >= paginated.totalPages}
                    className="size-7 rounded-[0.25rem] cursor-pointer"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Edit Dialog Modal (Koreksi Data) */}
      <Dialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Edit Laporan Terpilih: Koreksi Data
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbarui status CCTV bila terdapat koreksi pengamatan atau tindak lanjut teknisi.
            </DialogDescription>
          </DialogHeader>

          {editingItem && editingDraft && (
            <div className="space-y-4 py-2 text-xs">
              {/* Metadata Card Read-Only */}
              <div className="rounded-[0.25rem] border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Laporan:</span>
                  <span className="font-mono font-bold text-foreground">
                    {editingItem.reportDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lokasi Penugasan:</span>
                  <span className="font-heading font-bold text-foreground">
                    {editingItem.displayName}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <Label className="font-heading text-xs font-semibold text-foreground">
                  Kondisi Kamera Operasional
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingDraft(updateHistoryEditDraftStatus(editingDraft, "ON"))
                    }
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border text-xs font-heading font-semibold transition-colors cursor-pointer",
                      editingDraft.status === "ON"
                        ? "border-[var(--color-status-on-solid)] bg-[var(--color-status-on-solid)] text-white shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Check className="size-3.5" />
                    <span>ON SEMUA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingDraft(updateHistoryEditDraftStatus(editingDraft, "OFF"))
                    }
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border text-xs font-heading font-semibold transition-colors cursor-pointer",
                      editingDraft.status === "OFF"
                        ? "border-[var(--color-status-off-solid)] bg-[var(--color-status-off-solid)] text-white shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>ADA KENDALA / OFF</span>
                  </button>
                </div>
              </div>

              {/* Notes Textarea */}
              {editingDraft.status === "OFF" ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="dialog-edit-notes"
                    className="font-heading text-xs font-semibold text-destructive"
                  >
                    Catatan Kendala &amp; Tindak Lanjut
                  </Label>
                  <Textarea
                    id="dialog-edit-notes"
                    rows={3}
                    value={editingDraft.notes}
                    onChange={(e) =>
                      setEditingDraft({
                        ...editingDraft,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Contoh: Kamera gate 2 flickering saat hujan lebat. Sedang dalam perbaikan teknisi..."
                    className="rounded-[0.25rem] border-destructive/50 text-xs focus-visible:ring-destructive"
                  />
                </div>
              ) : (
                <div className="rounded-[0.25rem] border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground italic">
                  Catatan kendala otomatis dibersihkan saat kondisi dipulihkan ke ON SEMUA.
                </div>
              )}

              {/* Audit Metadata Notice */}
              <div className="rounded-[0.25rem] border border-border/80 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                <History className="mr-1.5 inline size-3" />
                <span>
                  Log ini akan diperbarui dan ditandai riwayat revisinya ke sistem pusat.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={closeEditDialog}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSaveEdit}
              className="cursor-pointer gap-1.5 rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" aria-hidden="true" />
                  <span>Simpan Perubahan Laporan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
