"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MapPin,
} from "lucide-react";
import { DailyMonitoringSummary } from "@/server/services/recap.service";

export function DailyMonitoringBoard({
  summary,
  whatsAppText,
}: {
  summary: DailyMonitoringSummary;
  whatsAppText: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(summary.reportDate);
  const [copied, setCopied] = useState(false);

  const handleDateChange = (nextDate: string) => {
    setSelectedDate(nextDate);
    router.push(`/admin?date=${encodeURIComponent(nextDate)}`);
  };

  const handleCopyWhatsApp = async () => {
    await navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-5">
        <div>
          <label
            htmlFor="admin-monitoring-date"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]"
          >
            <Calendar className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            <span>Tanggal Pemantauan Harian</span>
          </label>
          <input
            id="admin-monitoring-date"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="min-h-[44px] rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 font-mono text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          />
        </div>

        <button
          type="button"
          onClick={handleCopyWhatsApp}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-accent)] transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Format WhatsApp Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>Salin Format WhatsApp</span>
            </>
          )}
        </button>
      </div>

      <section
        aria-label="Ringkasan Metrik Harian"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Total Lokasi Aktif
            </span>
            <MapPin className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[var(--color-foreground)]">
            {summary.counts.totalLocations}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Sudah Lapor &bull; ON
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            {summary.counts.onCount}
          </div>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
              Ada Kendala / OFF
            </span>
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-red-700 dark:text-red-300">
            {summary.counts.offCount}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Belum Lapor
            </span>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-amber-700 dark:text-amber-300">
            {summary.counts.unreportedCount}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  <th className="px-4 py-3.5 font-semibold">Lokasi</th>
                  <th className="px-4 py-3.5 font-semibold">Status Hari Ini</th>
                  <th className="px-4 py-3.5 font-semibold">Catatan Kendala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {summary.items.map((item) => (
                  <tr key={item.locationId}>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono font-semibold text-[var(--color-foreground)]">
                      {item.displayName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {item.status === "ON" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>ON Semua</span>
                        </span>
                      ) : item.status === "OFF" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ada Kendala / OFF</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Belum Lapor</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-muted-foreground)]">
                      {item.notes ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold text-[var(--color-foreground)]">
              Pratinjau Teks WhatsApp
            </h2>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 font-mono text-xs leading-relaxed text-[var(--color-foreground)]">
            {whatsAppText}
          </pre>
        </div>
      </div>
    </div>
  );
}
