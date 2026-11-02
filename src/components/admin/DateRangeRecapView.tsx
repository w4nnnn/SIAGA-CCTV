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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
      <Card>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label htmlFor="filter-start-date" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tanggal Mulai
                </Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="min-h-[44px] font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="filter-end-date" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tanggal Akhir
                </Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="min-h-[44px] font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="filter-location" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Lokasi
                </Label>
                <select
                  id="filter-location"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="" className="bg-popover text-popover-foreground">
                    Semua Lokasi
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-popover text-popover-foreground">
                      {loc.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="filter-status" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </Label>
                <select
                  id="filter-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as "ALL" | "ON" | "OFF" | "UNREPORTED"
                    )
                  }
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="ALL" className="bg-popover text-popover-foreground">
                    Semua Status
                  </option>
                  <option value="ON" className="bg-popover text-popover-foreground">
                    ON
                  </option>
                  <option value="OFF" className="bg-popover text-popover-foreground">
                    Ada Kendala / OFF
                  </option>
                  <option value="UNREPORTED" className="bg-popover text-popover-foreground">
                    Belum Lapor
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  className="min-h-[44px] w-full cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span>Terapkan Filter</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <a
                href={excelUrl}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "min-h-[44px] cursor-pointer gap-2 border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
                )}
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                <span>Export Excel (.xlsx)</span>
              </a>

              <a
                href={pdfUrl}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "min-h-[44px] cursor-pointer gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                )}
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
                <span>Export PDF (.pdf)</span>
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base font-bold">
            Ringkasan per Lokasi ({recap.totalDays} Hari)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Lokasi</TableHead>
                <TableHead className="font-semibold">Hari ON</TableHead>
                <TableHead className="font-semibold">Hari OFF / Kendala</TableHead>
                <TableHead className="font-semibold">Hari Belum Lapor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.locationSummaries.map((loc) => (
                <TableRow key={loc.locationId}>
                  <TableCell className="font-mono font-semibold">
                    {loc.displayName}
                  </TableCell>
                  <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {loc.onDays}
                  </TableCell>
                  <TableCell className="font-mono text-destructive font-bold">
                    {loc.offDays}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {loc.unreportedDays}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base font-bold">
            Detail Laporan Harian ({recap.dailyRows.length} Baris)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Tanggal</TableHead>
                <TableHead className="font-semibold">Lokasi</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Catatan Kendala</TableHead>
                <TableHead className="font-semibold">Petugas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.dailyRows.map((row) => (
                <TableRow key={`${row.locationId}-${row.reportDate}`}>
                  <TableCell className="whitespace-nowrap font-mono">
                    {row.reportDate}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono font-semibold">
                    {row.displayName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.status === "ON" ? (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        <span>ON</span>
                      </Badge>
                    ) : row.status === "OFF" ? (
                      <Badge
                        variant="destructive"
                        className="gap-1 bg-destructive/15 text-destructive hover:bg-destructive/20"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        <span>Ada Kendala / OFF</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-muted-foreground"
                      >
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>Belum Lapor</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.notes ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.reporterName ?? "-"}
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
