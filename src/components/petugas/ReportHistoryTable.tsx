"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  History,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  TableProperties,
  User,
} from "lucide-react";
import {
  buildOperatorHistoryMatrix,
  detectActivePreset,
  getRangePreset,
  type OperatorHistoryCell,
  type OperatorHistoryRow,
} from "@/lib/view-models";
import { formatIndonesianDateHeader } from "@/lib/format";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import {
  submitBatchDailyReportsAction,
  updateHistoricalReportAction,
} from "@/server/actions/report.actions";
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
import { SimpleSelect } from "@/components/common/SimpleSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AssignedLocationOption {
  id: string;
  category?: string;
  name?: string;
  displayName: string;
  sortOrder?: number;
}

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

interface CellModalState {
  locationId: string;
  displayName: string;
  dateStr: string;
  reportId: string | null;
  status: "ON" | "OFF";
  notes: string;
  reporterName: string | null;
  updatedAt: Date | null;
}

export function ReportHistoryTable({
  locations,
  items,
  initialStartDate,
  initialEndDate,
  initialLocationId = "ALL",
  initialStatus = "ALL",
}: {
  locations: AssignedLocationOption[];
  items: ReportHistoryItem[];
  initialStartDate: string;
  initialEndDate: string;
  initialLocationId?: string;
  initialStatus?: "ALL" | "ON" | "OFF" | "UNREPORTED";
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [locationId, setLocationId] = useState(initialLocationId);
  const [status, setStatus] = useState<"ALL" | "ON" | "OFF" | "UNREPORTED">(
    initialStatus
  );

  const [activeCellModal, setActiveCellModal] = useState<CellModalState | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayDateInJakarta(), []);
  const activePreset = useMemo(
    () => detectActivePreset(startDate, endDate, todayStr),
    [startDate, endDate, todayStr]
  );

  // Dropdown options
  const locationOptions = useMemo(() => {
    return [
      { value: "ALL", label: "Semua Lokasi Penugasan" },
      ...locations.map((loc) => ({ value: loc.id, label: loc.displayName })),
    ];
  }, [locations]);

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "ON", label: "Hanya Status ON" },
    { value: "OFF", label: "Hanya Kendala / OFF" },
    { value: "UNREPORTED", label: "Hanya Belum Lapor" },
  ];

  // Filter lokasi untuk matriks
  const filteredLocations = useMemo(() => {
    if (!locationId || locationId === "ALL") return locations;
    return locations.filter((l) => l.id === locationId);
  }, [locations, locationId]);

  // Bangun matriks riwayat interaktif
  const matrix = useMemo(() => {
    return buildOperatorHistoryMatrix({
      locations: filteredLocations,
      reports: items,
      startDate,
      endDate,
      statusFilter: status,
    });
  }, [filteredLocations, items, startDate, endDate, status]);

  // Metrik KPI
  const { totalReported, normalCount, incidentCount, compliancePct } = useMemo(() => {
    let repCount = 0;
    let onCount = 0;
    let offCount = 0;
    for (const row of matrix.rows) {
      repCount += row.onDays + row.offDays;
      onCount += row.onDays;
      offCount += row.offDays;
    }
    const totalScheduled = matrix.rows.length * matrix.dates.length;
    const compPct =
      totalScheduled > 0
        ? Math.round((repCount / totalScheduled) * 1000) / 10
        : 0;

    return {
      totalReported: repCount,
      normalCount: onCount,
      incidentCount: offCount,
      compliancePct: compPct,
    };
  }, [matrix]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (locationId && locationId !== "ALL") params.set("locationId", locationId);
    if (status && status !== "ALL") params.set("status", status);
    router.push(`/petugas/riwayat?${params.toString()}`);
  };

  const handlePreset = (preset: "today" | "7d" | "month" | "30d") => {
    const range = getRangePreset(preset, todayStr);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    const params = new URLSearchParams();
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
    if (locationId && locationId !== "ALL") params.set("locationId", locationId);
    if (status && status !== "ALL") params.set("status", status);
    router.push(`/petugas/riwayat?${params.toString()}`);
  };

  const handleResetFilter = () => {
    const range = getRangePreset("month", todayStr);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setLocationId("ALL");
    setStatus("ALL");
    const params = new URLSearchParams();
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
    router.push(`/petugas/riwayat?${params.toString()}`);
  };

  const handleCellClick = (
    row: OperatorHistoryRow,
    dateStr: string,
    cell: OperatorHistoryCell
  ) => {
    setErrorMessage(null);
    setActiveCellModal({
      locationId: row.locationId,
      displayName: row.displayName,
      dateStr,
      reportId: cell.reportId,
      status: cell.status === "OFF" ? "OFF" : "ON",
      notes: cell.notes ?? "",
      reporterName: cell.reporterName,
      updatedAt: cell.updatedAt,
    });
  };

  const handleSaveModal = () => {
    if (!activeCellModal) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        if (activeCellModal.reportId) {
          // Update laporan yang sudah ada
          await updateHistoricalReportAction(activeCellModal.reportId, {
            status: activeCellModal.status,
            notes: activeCellModal.status === "OFF" ? activeCellModal.notes : null,
          });
          toast.success(
            `Laporan ${activeCellModal.displayName} (${activeCellModal.dateStr}) berhasil diperbarui.`
          );
        } else {
          // Buat laporan baru untuk tanggal dan lokasi yang belum lapor
          await submitBatchDailyReportsAction({
            reportDate: activeCellModal.dateStr,
            items: [
              {
                locationId: activeCellModal.locationId,
                status: activeCellModal.status,
                notes:
                  activeCellModal.status === "OFF" ? activeCellModal.notes : null,
              },
            ],
          });
          toast.success(
            `Laporan baru ${activeCellModal.displayName} (${activeCellModal.dateStr}) berhasil disimpan.`
          );
        }

        setActiveCellModal(null);
        router.refresh();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Gagal menyimpan laporan.";
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
            Modul Verifikasi &amp; Audit Riwayat
          </span>
        </div>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Riwayat &amp; Perbaikan Laporan CCTV
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Pantau keaktifan harian dalam tabel matriks per titik lokasi. Klik sel
          tanggal untuk mengoreksi kendala atau melengkapi shift yang terlewat.
        </p>
      </div>

      {/* KPI 3-Card Summary Grid */}
      <section
        aria-label="Ringkasan Riwayat Log"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-primary bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Kepatuhan Lapor Shift
            </span>
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {compliancePct}%
            </div>
            <span className="rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {totalReported} Data Terisi
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-on-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-on)]">
              Normal (ON)
            </span>
            <CheckCircle2
              className="size-4 text-[var(--color-status-on)]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-[var(--color-status-on)] sm:text-3xl">
              {normalCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Shift
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              {totalReported > 0
                ? Math.round((normalCount / totalReported) * 100)
                : 0}
              % Uptime
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-off-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-off)]">
              Kendala (OFF)
            </span>
            <AlertTriangle
              className="size-4 text-[var(--color-status-off)]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-[var(--color-status-off)] sm:text-3xl">
              {incidentCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Catatan
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
              {incidentCount > 0 ? "Perlu Evaluasi" : "Zero Downtime"}
            </span>
          </div>
        </Card>
      </section>

      {/* Filter and Preset Toolbar Card */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Preset Buttons & Sync Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Preset Rentang:
              </span>
              {[
                { id: "today" as const, label: "Hari Ini" },
                { id: "7d" as const, label: "7 Hari Terakhir" },
                { id: "month" as const, label: "Bulan Ini" },
                { id: "30d" as const, label: "30 Hari Terakhir" },
              ].map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePreset(p.id)}
                    className={cn(
                      "rounded-[0.25rem] border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                        : "border-border bg-muted/40 text-foreground hover:bg-muted"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {activePreset === "custom" && (
                <span className="rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Rentang Kustom
                </span>
              )}
              <span className="size-2 rounded-full bg-[var(--color-status-on-solid)]" />
              <span>Matriks Siaga Terhubung</span>
            </div>
          </div>

          {/* Filter Form Controls */}
          <form
            onSubmit={handleApplyFilter}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12"
          >
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <Label
                htmlFor="filter-start-date"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Periode Mulai
              </Label>
              <Input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-full rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <Label
                htmlFor="filter-end-date"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Periode Sampai
              </Label>
              <Input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-full rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lokasi Penugasan
              </Label>
              <SimpleSelect
                value={locationId}
                onValueChange={setLocationId}
                options={locationOptions}
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
              <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Filter
              </Label>
              <SimpleSelect
                value={status}
                onValueChange={(val) =>
                  setStatus(val as "ALL" | "ON" | "OFF" | "UNREPORTED")
                }
                options={statusOptions}
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
              <Button
                type="submit"
                className="h-9 flex-1 cursor-pointer gap-2 rounded-[0.25rem] bg-primary font-heading text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Filter className="size-3.5" aria-hidden="true" />
                <span>Filter</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilter}
                title="Reset Filter"
                aria-label="Reset Filter"
                className="h-9 size-9 shrink-0 cursor-pointer rounded-[0.25rem]"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Matriks Riwayat Interaktif */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TableProperties className="size-4 text-primary" />
            <div>
              <h2 className="font-heading text-sm font-bold text-foreground">
                Tabel Matriks Pemantauan: {startDate} s/d {endDate}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Nama lokasi terkunci di kiri. Klik sel tanggal untuk melihat
                catatan atau mengedit status laporan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-[var(--color-status-on)]">
              <span className="size-2 rounded-[0.125rem] bg-[var(--color-status-on-solid)]" />
              ON (Normal)
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--color-status-off)]">
              <span className="size-2 rounded-[0.125rem] bg-[var(--color-status-off-solid)]" />
              OFF (Kendala)
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-2 rounded-[0.125rem] bg-muted-foreground" />
              - (Belum Lapor / Klik Isi)
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 text-[11px]">
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 z-30 bg-muted/95 border-r border-border font-heading font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap align-middle"
                  >
                    Lokasi Penugasan
                  </TableHead>
                  {matrix.monthGroups.map((group) => (
                    <TableHead
                      key={group.monthKey}
                      colSpan={group.dates.length}
                      className="text-center font-heading text-xs font-bold uppercase tracking-wider text-foreground border-b border-l border-border bg-muted/60 py-2"
                    >
                      {group.monthLabel}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="border-b border-border bg-muted/30 text-[10px]">
                  {matrix.monthGroups.flatMap((group) =>
                    group.dates.map((d) => (
                      <TableHead
                        key={d.dateStr}
                        className="text-center font-mono text-[10px] font-bold text-muted-foreground px-1.5 py-1.5 border-l border-border/60 whitespace-nowrap"
                      >
                        {d.dayLabel}
                      </TableHead>
                    ))
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={matrix.dates.length + 1}
                      className="py-12 text-center text-xs text-muted-foreground"
                    >
                      Tidak ada titik lokasi penugasan yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  matrix.rows.map((row) => (
                    <TableRow
                      key={row.locationId}
                      className="group border-b border-border/70 hover:bg-muted/30"
                    >
                      <TableCell className="sticky left-0 z-20 bg-card group-hover:bg-muted/60 border-r border-border font-heading text-xs font-semibold text-foreground whitespace-nowrap">
                        {row.displayName}
                      </TableCell>
                      {matrix.dates.map((d) => {
                        const cell = row.cells[d];
                        const isOff = cell?.status === "OFF";
                        const isOn = cell?.status === "ON";
                        const hasNotes = Boolean(cell?.notes && cell.notes.trim().length > 0);

                        return (
                          <TableCell
                            key={d}
                            className="p-1 text-center border-l border-border/40"
                          >
                            <button
                              type="button"
                              onClick={() => handleCellClick(row, d, cell)}
                              title={
                                isOn
                                  ? `${row.displayName} - ${d}: Normal (Klik untuk koreksi)`
                                  : isOff
                                  ? `${row.displayName} - ${d}: OFF (${cell.notes || "Ada Kendala"}) - Klik untuk edit`
                                  : `${row.displayName} - ${d}: Belum Lapor (Klik untuk isi laporan)`
                              }
                              className={cn(
                                "relative inline-flex items-center justify-center rounded-[0.15rem] px-1.5 py-0.5 text-[9px] font-mono font-bold transition-all cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-primary",
                                isOn &&
                                  "bg-[var(--color-status-on-surface)] text-[var(--color-status-on)] border border-[var(--color-status-on-border)] hover:brightness-95",
                                isOff &&
                                  "bg-[var(--color-status-off-surface)] text-[var(--color-status-off)] border border-[var(--color-status-off-border)] hover:brightness-95",
                                !isOn &&
                                  !isOff &&
                                  "bg-muted/60 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-transparent"
                              )}
                            >
                              {isOn ? "ON" : isOff ? "OFF" : "-"}
                              {isOff && hasNotes && (
                                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-destructive" />
                              )}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Input Dialog Modal */}
      <Dialog
        open={Boolean(activeCellModal)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCellModal(null);
            setErrorMessage(null);
          }
        }}
      >
        <DialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              {activeCellModal?.reportId
                ? "Koreksi Laporan Harian"
                : "Input Laporan Susulan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {activeCellModal?.reportId
                ? "Perbarui kondisi titik kamera operasional bila terdapat tindak lanjut atau koreksi."
                : "Isi laporan pengawasan untuk tanggal dan lokasi yang belum tercatat."}
            </DialogDescription>
          </DialogHeader>

          {activeCellModal && (
            <div className="space-y-4 py-2 text-xs">
              {/* Metadata Card */}
              <div className="rounded-[0.25rem] border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatIndonesianDateHeader(activeCellModal.dateStr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lokasi:</span>
                  <span className="font-heading font-bold text-foreground">
                    {activeCellModal.displayName}
                  </span>
                </div>
                {activeCellModal.reporterName && (
                  <div className="flex justify-between items-center pt-1 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground">Petugas Pelapor:</span>
                    <span className="font-semibold text-foreground">
                      {activeCellModal.reporterName}
                    </span>
                  </div>
                )}
                {activeCellModal.updatedAt && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Terakhir Diperbarui:</span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(activeCellModal.updatedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </span>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-[0.25rem] border border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] p-3 text-xs font-medium text-[var(--color-status-off)]"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-1.5">
                <Label className="font-heading text-xs font-semibold text-foreground">
                  Kondisi Kamera Operasional
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCellModal({
                        ...activeCellModal,
                        status: "ON",
                        notes: "",
                      })
                    }
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border text-xs font-heading font-semibold transition-colors cursor-pointer",
                      activeCellModal.status === "ON"
                        ? "border-[var(--color-status-on-solid)] bg-[var(--color-status-on-solid)] text-white shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Check className="size-3.5" />
                    <span>ON SEMUA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveCellModal({
                        ...activeCellModal,
                        status: "OFF",
                      })
                    }
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-[0.25rem] border text-xs font-heading font-semibold transition-colors cursor-pointer",
                      activeCellModal.status === "OFF"
                        ? "border-[var(--color-status-off-solid)] bg-[var(--color-status-off-solid)] text-white shadow-xs font-bold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                    <span>ADA KENDALA / OFF</span>
                  </button>
                </div>
              </div>

              {/* Notes Input */}
              {activeCellModal.status === "OFF" ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="dialog-modal-notes"
                    className="font-heading text-xs font-semibold text-destructive"
                  >
                    Catatan Kendala &amp; Tindak Lanjut
                  </Label>
                  <Textarea
                    id="dialog-modal-notes"
                    rows={3}
                    value={activeCellModal.notes}
                    onChange={(e) =>
                      setActiveCellModal({
                        ...activeCellModal,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Contoh: Kamera gate 2 flickering saat hujan. Sedang dalam perbaikan teknisi..."
                    className="rounded-[0.25rem] border-destructive/50 text-xs focus-visible:ring-destructive"
                  />
                </div>
              ) : (
                <div className="rounded-[0.25rem] border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground italic">
                  Kondisi ON SEMUA menandakan seluruh kamera beroperasi normal tanpa kendala.
                </div>
              )}

              {/* Audit Notice */}
              <div className="rounded-[0.25rem] border border-border/80 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                <History className="mr-1.5 inline size-3" />
                <span>
                  Log perbaikan tersimpan dengan cap waktu audit otomatis ke sistem.
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
              onClick={() => {
                setActiveCellModal(null);
                setErrorMessage(null);
              }}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleSaveModal}
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
                  <span>Simpan Laporan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
