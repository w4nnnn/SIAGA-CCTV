"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PieChart,
  Search,
  Video,
} from "lucide-react";
import type { DailyMonitoringSummary } from "@/server/services/recap.service";
import { formatIndonesianDateHeader } from "@/lib/format";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import {
  computeDistribution,
  filterDashboardItems,
  percentOf,
  shiftDate,
} from "@/lib/view-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge, StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

export function DailyMonitoringBoard({
  summary,
}: {
  summary: DailyMonitoringSummary;
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = useMemo(() => getTodayDateInJakarta(), []);
  const formattedSelectedDate = useMemo(
    () => formatIndonesianDateHeader(summary.reportDate),
    [summary.reportDate]
  );

  const categories = useMemo(() => {
    const set = new Set(summary.items.map((i) => i.category));
    return ["ALL", ...Array.from(set).sort()];
  }, [summary.items]);

  const filteredItems = useMemo(
    () => filterDashboardItems(summary.items, selectedCategory, searchQuery),
    [summary.items, selectedCategory, searchQuery]
  );

  const offItems = useMemo(
    () => summary.items.filter((i) => i.status === "OFF"),
    [summary.items]
  );

  const distribution = useMemo(
    () => computeDistribution(summary.counts),
    [summary.counts]
  );

  const compliancePct = useMemo(() => {
    const reported = summary.counts.onCount + summary.counts.offCount;
    return percentOf(reported, summary.counts.totalLocations);
  }, [summary.counts]);

  const goToDate = (nextDate: string) => {
    router.push(`/admin?date=${encodeURIComponent(nextDate)}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-[0.25rem] bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tracking-wider uppercase">
              Live Telemetry
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-status-on)]">
              <span className="size-2 rounded-full bg-[var(--color-status-on-solid)] animate-pulse" />
              Sinkronisasi Terhubung
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard Pemantauan CCTV
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Pemantauan status harian CCTV seluruh lokasi operasional secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Navigator */}
          <div className="flex items-center rounded-[0.25rem] border border-border bg-card p-0.5 shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => goToDate(shiftDate(summary.reportDate, -1))}
              aria-label="Hari sebelumnya"
              className="size-8 cursor-pointer rounded-[0.25rem]"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1.5 px-2.5 font-heading text-xs font-semibold text-foreground">
              <Calendar className="size-3.5 text-primary" />
              <span>{formattedSelectedDate}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => goToDate(shiftDate(summary.reportDate, 1))}
              aria-label="Hari berikutnya"
              className="size-8 cursor-pointer rounded-[0.25rem]"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {summary.reportDate !== todayStr && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToDate(todayStr)}
              className="h-8 cursor-pointer rounded-[0.25rem] font-semibold text-xs"
            >
              Hari Ini
            </Button>
          )}

          {/* Segmented Category Filter Pills */}
          <div className="inline-flex items-center gap-1 rounded-[0.25rem] border border-border bg-muted/40 p-0.5 shadow-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-[0.2rem] px-2.5 py-1 text-xs font-heading font-semibold transition-all cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {cat === "ALL" ? "Semua" : cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI 4-Card Summary Grid (Border Accent Atas) */}
      <section
        aria-label="Metrik Pemantauan Hari Ini"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Total Lokasi */}
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-primary bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Lokasi Terdaftar
            </span>
            <Building2 className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {summary.counts.totalLocations}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Titik
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              100% Terpetakan
            </span>
          </div>
        </Card>

        {/* Sudah Lapor ON */}
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-on-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-on)]">
              Sudah Lapor &bull; ON
            </span>
            <Video className="size-4 text-[var(--color-status-on)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold tracking-tight text-[var(--color-status-on)]">
              {summary.counts.onCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Lokasi
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              {distribution.onPct}% Selesai
            </span>
          </div>
        </Card>

        {/* Ada Kendala OFF */}
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-off-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-off)]">
              Ada Kendala / OFF
            </span>
            <AlertTriangle className="size-4 text-[var(--color-status-off)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold tracking-tight text-[var(--color-status-off)]">
              {summary.counts.offCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Lokasi
              </span>
            </div>
            <span
              className={cn(
                "rounded-[0.25rem] border px-2 py-0.5 text-[11px] font-semibold",
                summary.counts.offCount > 0
                  ? "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]"
                  : "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {summary.counts.offCount > 0 ? "Butuh Intervensi" : "Nihil Kendala"}
            </span>
          </div>
        </Card>

        {/* Belum Melapor */}
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-warning-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-warning)]">
              Belum Melapor
            </span>
            <ClipboardList className="size-4 text-[var(--color-status-warning)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-3xl font-bold tracking-tight text-[var(--color-status-warning)]">
              {summary.counts.unreportedCount}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Lokasi
              </span>
            </div>
            <span
              className={cn(
                "rounded-[0.25rem] border px-2 py-0.5 text-[11px] font-semibold",
                summary.counts.unreportedCount > 0
                  ? "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]"
                  : "border-border bg-muted/60 text-muted-foreground"
              )}
            >
              {summary.counts.unreportedCount > 0 ? "Menunggu Petugas" : "Semua Terisi"}
            </span>
          </div>
        </Card>
      </section>

      {/* Critical Incident Alert Section (Hanya tampil jika ada OFF) */}
      {offItems.length > 0 && (
        <div className="rounded-[0.5rem] border border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-status-off-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-[0.25rem] bg-[var(--color-status-off-solid)] text-white">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <h2 className="font-heading text-sm font-bold text-[var(--color-status-off)]">
                  Peringatan Status Kendala Harian
                </h2>
                <p className="text-xs text-[var(--color-status-off)]/80">
                  Perlu tindak lanjut cepat dari teknisi atau pengawas terkait.
                </p>
              </div>
            </div>
            <span className="rounded-[0.25rem] bg-[var(--color-status-off-solid)] px-2.5 py-0.5 font-heading text-xs font-bold text-white uppercase tracking-wider">
              {offItems.length} Lokasi Berkendala
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {offItems.map((item) => (
              <div
                key={item.locationId}
                className="rounded-[0.25rem] border border-[var(--color-status-off-border)] bg-card p-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={item.category} />
                    <span className="font-heading text-sm font-bold text-foreground">
                      {item.displayName}
                    </span>
                  </div>
                  <StatusBadge status="OFF" />
                </div>
                <div className="mt-2 rounded-[0.25rem] bg-[var(--color-status-off-surface)] p-2.5 text-xs text-foreground">
                  <span className="font-semibold text-[var(--color-status-off)]">
                    Catatan Kendala:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {item.notes && item.notes.trim().length > 0
                      ? item.notes
                      : "Tidak ada catatan kendala rinci."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Data Table (70%) + Distribution Widget (30%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Table Column (8 cols ~ 67%) */}
        <div className="lg:col-span-8">
          <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
            <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-base font-bold text-foreground">
                  Tabel Pemantauan Status Lokasi Hari Ini
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Daftar seluruh titik terminal dan status pelaporan terkini.
                </p>
              </div>

              {/* Search Field Inline */}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari lokasi / catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 rounded-[0.25rem] pl-8 text-xs font-mono"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40">
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Lokasi Operasional
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Kategori
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Status CCTV
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Catatan Kendala
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-xs text-muted-foreground"
                        >
                          Tidak ada lokasi yang cocok dengan filter atau kata kunci.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow
                          key={item.locationId}
                          className="border-b border-border/70 hover:bg-muted/30"
                        >
                          <TableCell className="font-heading text-sm font-semibold text-foreground whitespace-nowrap">
                            {item.displayName}
                          </TableCell>
                          <TableCell>
                            <CategoryBadge category={item.category} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.notes ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Menampilkan {filteredItems.length} dari {summary.items.length} total lokasi
                </span>
                <span className="font-semibold text-foreground">
                  Kepatuhan Pelaporan: {compliancePct}% Terisi
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Widget Column (4 cols ~ 33%) */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="rounded-[0.5rem] border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="flex size-7 items-center justify-center rounded-[0.25rem] bg-secondary text-secondary-foreground">
                <PieChart className="size-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Distribusi Kondisi Unit
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Kesiapan armada CCTV regional
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Kesiapan Operasional</span>
                <span className="font-heading text-2xl font-bold text-[var(--color-status-on)]">
                  {distribution.operationalPct}%
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-[0.25rem] bg-muted">
                <div
                  style={{ width: `${distribution.onPct}%` }}
                  title={`ON: ${summary.counts.onCount} (${distribution.onPct}%)`}
                  className="bg-[var(--color-status-on-solid)] transition-all"
                />
                <div
                  style={{ width: `${distribution.offPct}%` }}
                  title={`OFF: ${summary.counts.offCount} (${distribution.offPct}%)`}
                  className="bg-[var(--color-status-off-solid)] transition-all"
                />
                <div
                  style={{ width: `${distribution.unreportedPct}%` }}
                  title={`Belum Lapor: ${summary.counts.unreportedCount} (${distribution.unreportedPct}%)`}
                  className="bg-[var(--color-status-pending-solid)] transition-all"
                />
              </div>

              {/* Legends */}
              <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[var(--color-status-on-solid)]" />
                    <span>Normal &bull; ON</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {summary.counts.onCount} unit ({distribution.onPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[var(--color-status-off-solid)]" />
                    <span>Kendala &bull; OFF</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {summary.counts.offCount} unit ({distribution.offPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[var(--color-status-pending-solid)]" />
                    <span>Belum Melapor</span>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {summary.counts.unreportedCount} unit ({distribution.unreportedPct}%)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
