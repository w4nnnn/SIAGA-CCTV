"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Filter,
  Grid3X3,
  RotateCcw,
  ShieldCheck,
  TableProperties,
} from "lucide-react";
import { buildExportDownloadUrl, getTodayDateInJakarta } from "@/lib/ui-state";
import type { DateRangeRecapResult } from "@/server/services/recap.service";
import {
  buildActivityMatrix,
  buildAuditRows,
  computeRecapKpis,
  detectActivePreset,
  getRangePreset,
} from "@/lib/view-models";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge, StatusBadge } from "@/components/common/StatusBadge";
import { SimpleSelect } from "@/components/common/SimpleSelect";
import { cn } from "@/lib/utils";

interface LocationOption {
  id: string;
  displayName: string;
}

export function DateRangeRecapView({
  recap,
  locations,
  initialLocationId,
  initialStatus,
}: {
  recap: DateRangeRecapResult;
  locations: LocationOption[];
  initialLocationId?: string;
  initialStatus?: "ALL" | "ON" | "OFF" | "UNREPORTED";
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(recap.startDate);
  const [endDate, setEndDate] = useState(recap.endDate);
  const [locationId, setLocationId] = useState(initialLocationId ?? "");
  const [status, setStatus] = useState<"ALL" | "ON" | "OFF" | "UNREPORTED">(
    initialStatus ?? "ALL"
  );

  const todayStr = useMemo(() => getTodayDateInJakarta(), []);

  const activePreset = useMemo(
    () => detectActivePreset(startDate, endDate, todayStr),
    [startDate, endDate, todayStr]
  );

  // Hitung KPI, Matriks, dan Tabel Audit
  const kpis = useMemo(() => computeRecapKpis(recap), [recap]);
  const matrix = useMemo(() => buildActivityMatrix(recap), [recap]);
  const auditRows = useMemo(() => buildAuditRows(recap), [recap]);

  const locationOptions = useMemo(() => {
    return [
      { value: "", label: "Semua Lokasi Operasional" },
      ...locations.map((loc) => ({ value: loc.id, label: loc.displayName })),
    ];
  }, [locations]);

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "ON", label: "Hanya Status ON" },
    { value: "OFF", label: "Hanya Kendala / OFF" },
    { value: "UNREPORTED", label: "Hanya Belum Lapor" },
  ];

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (locationId) params.set("locationId", locationId);
    if (status && status !== "ALL") params.set("status", status);
    router.push(`/admin/rekap?${params.toString()}`);
  };

  const handlePreset = (preset: "today" | "7d" | "month" | "30d") => {
    const range = getRangePreset(preset, todayStr);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    const params = new URLSearchParams();
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
    if (locationId) params.set("locationId", locationId);
    if (status && status !== "ALL") params.set("status", status);
    router.push(`/admin/rekap?${params.toString()}`);
  };

  const excelUrl = buildExportDownloadUrl("excel", {
    startDate,
    endDate,
    locationId: locationId || undefined,
    status,
  });

  const pdfUrl = buildExportDownloadUrl("pdf", {
    startDate,
    endDate,
    locationId: locationId || undefined,
    status,
  });

  return (
    <div className="space-y-6">
      {/* Header and Export Action Buttons */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-[0.25rem] bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tracking-wider uppercase">
              Telemetri &amp; Audit Pengawasan Operasional
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Rekapitulasi &amp; Export Laporan CCTV
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Laporan agregat berkala, pemantauan kepatuhan harian, dan berkas audit operasional surveillance.
          </p>
        </div>

        {/* Primary Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={excelUrl}
            className="inline-flex h-9 items-center gap-2 rounded-[0.25rem] bg-[var(--color-status-on-solid)] px-3.5 font-heading text-xs font-bold text-white shadow-xs hover:bg-[var(--color-status-on-solid)]/90 transition-colors"
          >
            <FileSpreadsheet className="size-4" />
            <span>Export Excel (.xlsx)</span>
          </a>

          <a
            href={pdfUrl}
            className="inline-flex h-9 items-center gap-2 rounded-[0.25rem] bg-[var(--color-status-off-solid)] px-3.5 font-heading text-xs font-bold text-white shadow-xs hover:bg-[var(--color-status-off-solid)]/90 transition-colors"
          >
            <FileDown className="size-4" />
            <span>Export PDF (.pdf)</span>
          </a>
        </div>
      </div>

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
              <span>Database Terkoneksi: Log Shift Terverifikasi</span>
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
                Lokasi Operasional
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

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <Label
                aria-hidden="true"
                className="block text-xs font-semibold uppercase tracking-wider text-transparent select-none"
              >
                Aksi
              </Label>
              <Button
                type="submit"
                className="h-9 w-full cursor-pointer gap-2 rounded-[0.25rem] bg-primary font-heading text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Filter className="size-3.5" aria-hidden="true" />
                <span>Terapkan Filter</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary KPI Widgets (3 Cards) */}
      <section
        aria-label="Ringkasan Metrik Rekapitulasi"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-primary bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Kepatuhan Lapor
            </span>
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold text-foreground">
              {kpis.compliancePct}%
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              {kpis.reportedCount} dari {kpis.scheduledCount} Shift
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${Math.min(100, kpis.compliancePct)}%` }}
              className="h-full bg-primary"
            />
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-on-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-on)]">
              Hari Bebas Kendala
            </span>
            <CheckCircle2 className="size-4 text-[var(--color-status-on)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold text-[var(--color-status-on)]">
              {kpis.offFreeDays} Hari
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              Reliabilitas {kpis.offFreePct}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${Math.min(100, kpis.offFreePct)}%` }}
              className="h-full bg-[var(--color-status-on-solid)]"
            />
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-off-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-off)]">
              Insiden Kendala Tercatat
            </span>
            <AlertTriangle className="size-4 text-[var(--color-status-off)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold text-[var(--color-status-off)]">
              {kpis.incidentCount} Lokasi-Hari
            </div>
            <span
              className={cn(
                "rounded-[0.25rem] border px-2 py-0.5 text-[11px] font-semibold",
                kpis.incidentCount > 0
                  ? "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]"
                  : "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {kpis.incidentCount > 0 ? "Perlu Evaluasi" : "Zero Downtime"}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{
                width: `${kpis.scheduledCount > 0 ? Math.min(100, (kpis.incidentCount / kpis.scheduledCount) * 100) : 0}%`,
              }}
              className="h-full bg-[var(--color-status-off-solid)]"
            />
          </div>
        </Card>
      </section>

      {/* Matriks Keaktifan (Tampil jika <= 31 hari) */}
      {matrix.dates.length > 0 && matrix.dates.length <= 31 && (
        <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="size-4 text-primary" />
              <div>
                <h2 className="font-heading text-sm font-bold text-foreground">
                  Matriks Keaktifan: {startDate} s/d {endDate}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Heatmap observasi harian per titik lokasi ({matrix.dates.length} hari)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
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
                - (Pending)
              </span>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 text-[11px]">
                    <TableHead className="font-heading font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Lokasi Operasional
                    </TableHead>
                    <TableHead className="font-heading font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Tipe
                    </TableHead>
                    {matrix.dates.map((d) => (
                      <TableHead
                        key={d}
                        className="text-center font-mono text-[10px] uppercase text-muted-foreground px-1 whitespace-nowrap"
                      >
                        {d.slice(5)}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-heading font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      Reliabilitas
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.rows.map((row) => (
                    <TableRow key={row.locationId} className="border-b border-border/70">
                      <TableCell className="font-heading text-xs font-semibold text-foreground whitespace-nowrap">
                        {row.displayName}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={row.category} />
                      </TableCell>
                      {matrix.dates.map((d) => {
                        const cell = row.cells[d] ?? "UNREPORTED";
                        return (
                          <TableCell key={d} className="p-1 text-center">
                            {cell === "ON" ? (
                              <span
                                title={`${d}: Normal (ON)`}
                                className="inline-block rounded-[0.15rem] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)] border border-[var(--color-status-on-border)] px-1 py-0.5 text-[9px] font-mono font-bold"
                              >
                                ON
                              </span>
                            ) : cell === "OFF" ? (
                              <span
                                title={`${d}: Ada Kendala (OFF)`}
                                className="inline-block rounded-[0.15rem] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)] border border-[var(--color-status-off-border)] px-1 py-0.5 text-[9px] font-mono font-bold"
                              >
                                OFF
                              </span>
                            ) : (
                              <span
                                title={`${d}: Belum Lapor`}
                                className="inline-block rounded-[0.15rem] bg-muted text-muted-foreground px-1 py-0.5 text-[9px] font-mono"
                              >
                                -
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground whitespace-nowrap">
                        {row.activePct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabel Detail Audit & Unduh Resmi */}
      <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <TableProperties className="size-4 text-primary" />
            <div>
              <h2 className="font-heading text-sm font-bold text-foreground">
                Tabel Detail Audit &amp; Unduh Resmi
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Akumulasi kehadiran telemetri yang diexport ke format Excel dan PDF
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40">
                  <TableHead className="w-10 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    No
                  </TableHead>
                  <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nama Lokasi Operasional
                  </TableHead>
                  <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kategori
                  </TableHead>
                  <TableHead className="text-center font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hari ON
                  </TableHead>
                  <TableHead className="text-center font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hari OFF
                  </TableHead>
                  <TableHead className="text-right font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Keaktifan (%)
                  </TableHead>
                  <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Catatan Kendala Dominan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      Tidak ada data ringkasan lokasi untuk kriteria ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditRows.map((row) => (
                    <TableRow key={row.locationId} className="border-b border-border/70 hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.no}
                      </TableCell>
                      <TableCell className="font-heading text-xs font-bold text-foreground whitespace-nowrap">
                        {row.displayName}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={row.category} />
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-[var(--color-status-on)]">
                        {row.onDays}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-destructive">
                        {row.offDays}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                        {row.activePct}%
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                        {row.latestNote ?? "Operasional prima / nihil kendala"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
