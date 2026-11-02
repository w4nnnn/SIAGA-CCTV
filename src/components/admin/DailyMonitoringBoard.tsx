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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="admin-monitoring-date"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Calendar
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>Tanggal Pemantauan Harian</span>
            </Label>
            <Input
              id="admin-monitoring-date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="min-h-[44px] w-auto font-mono text-sm"
            />
          </div>

          <Button
            type="button"
            onClick={handleCopyWhatsApp}
            className="min-h-[44px] cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
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
          </Button>
        </CardContent>
      </Card>

      <section
        aria-label="Ringkasan Metrik Harian"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Lokasi Aktif
              </span>
              <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-foreground">
              {summary.counts.totalLocations}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Sudah Lapor &bull; ON
              </span>
              <CheckCircle2
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {summary.counts.onCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Ada Kendala / OFF
              </span>
              <AlertTriangle
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-destructive">
              {summary.counts.offCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Belum Lapor
              </span>
              <Clock
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div className="mt-2 font-mono text-3xl font-bold text-amber-700 dark:text-amber-300">
              {summary.counts.unreportedCount}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Lokasi</TableHead>
                <TableHead className="font-semibold">Status Hari Ini</TableHead>
                <TableHead className="font-semibold">Catatan Kendala</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.items.map((item) => (
                <TableRow key={item.locationId}>
                  <TableCell className="whitespace-nowrap font-mono font-semibold">
                    {item.displayName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.status === "ON" ? (
                      <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>ON Semua</span>
                      </Badge>
                    ) : item.status === "OFF" ? (
                      <Badge
                        variant="destructive"
                        className="gap-1.5 bg-destructive/15 text-destructive hover:bg-destructive/20"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Ada Kendala / OFF</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1.5 text-muted-foreground"
                      >
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Belum Lapor</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.notes ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
