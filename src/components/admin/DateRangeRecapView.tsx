"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileDown,
  FileSpreadsheet,
  Filter,
} from "lucide-react";
import { buildExportDownloadUrl } from "@/lib/ui-state";
import { DateRangeRecapResult } from "@/server/services/recap.service";

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

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    if (locationId) params.set("locationId", locationId);
    if (status) params.set("status", status);
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
      <form
        onSubmit={handleApplyFilter}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-start-date"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
            >
              Tanggal Mulai
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm text-[var(--color-foreground)]"
            />
          </div>

          <div>
            <label
              htmlFor="filter-end-date"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
            >
              Tanggal Akhir
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm text-[var(--color-foreground)]"
            />
          </div>

          <div>
            <label
              htmlFor="filter-location"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
            >
              Lokasi
            </label>
            <select
              id="filter-location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            >
              <option value="">Semua Lokasi</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-status"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "ALL" | "ON" | "OFF" | "UNREPORTED"
                )
              }
              className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ON">ON</option>
              <option value="OFF">Ada Kendala / OFF</option>
              <option value="UNREPORTED">Belum Lapor</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] transition-colors duration-200 hover:opacity-90"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span>Terapkan Filter</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <a
            href={excelUrl}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors duration-200 hover:bg-emerald-500/20 dark:text-emerald-300"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Export Excel (.xlsx)</span>
          </a>

          <a
            href={pdfUrl}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-700 transition-colors duration-200 hover:bg-red-500/20 dark:text-red-300"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            <span>Export PDF (.pdf)</span>
          </a>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-mono text-lg font-bold text-[var(--color-foreground)]">
          Ringkasan per Lokasi ({recap.totalDays} Hari)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                <th className="px-4 py-3.5 font-semibold">Lokasi</th>
                <th className="px-4 py-3.5 font-semibold">Hari ON</th>
                <th className="px-4 py-3.5 font-semibold">Hari OFF / Kendala</th>
                <th className="px-4 py-3.5 font-semibold">Hari Belum Lapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recap.locationSummaries.map((loc) => (
                <tr key={loc.locationId}>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {loc.displayName}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">
                    {loc.onDays}
                  </td>
                  <td className="px-4 py-3 font-mono text-red-600 dark:text-red-400">
                    {loc.offDays}
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--color-muted-foreground)]">
                    {loc.unreportedDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-lg font-bold text-[var(--color-foreground)]">
          Detail Laporan Harian ({recap.dailyRows.length} Baris)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                <th className="px-4 py-3.5 font-semibold">Lokasi</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Catatan Kendala</th>
                <th className="px-4 py-3.5 font-semibold">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recap.dailyRows.map((row) => (
                <tr key={`${row.locationId}-${row.reportDate}`}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">
                    {row.reportDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold">
                    {row.displayName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.status === "ON" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ON</span>
                      </span>
                    ) : row.status === "OFF" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ada Kendala / OFF</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Belum Lapor</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {row.notes ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                    {row.reporterName ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
