import type {
  DateRangeRecapResult,
  DailyMonitoringSummary,
} from "@/server/services/recap.service";

export type ReportCellStatus = "ON" | "OFF" | "UNREPORTED";

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function computeDistribution(counts: DailyMonitoringSummary["counts"]) {
  const total = counts.totalLocations;
  return {
    onPct: percentOf(counts.onCount, total),
    offPct: percentOf(counts.offCount, total),
    unreportedPct: percentOf(counts.unreportedCount, total),
    operationalPct: percentOf(counts.onCount, total),
  };
}

export function computeRecapKpis(recap: DateRangeRecapResult) {
  const locationCount = recap.locationSummaries.length;
  const scheduledCount = locationCount * recap.totalDays;
  const reportedCount = recap.locationSummaries.reduce(
    (sum, l) => sum + l.onDays + l.offDays,
    0
  );
  const incidentCount = recap.locationSummaries.reduce(
    (sum, l) => sum + l.offDays,
    0
  );

  const byDate = new Map<string, { on: number; other: number }>();
  for (const row of recap.dailyRows) {
    const entry = byDate.get(row.reportDate) ?? { on: 0, other: 0 };
    if (row.status === "ON") entry.on += 1;
    else entry.other += 1;
    byDate.set(row.reportDate, entry);
  }
  let offFreeDays = 0;
  for (const entry of byDate.values()) {
    if (entry.on > 0 && entry.other === 0) offFreeDays += 1;
  }

  return {
    totalDays: recap.totalDays,
    scheduledCount,
    reportedCount,
    compliancePct: percentOf(reportedCount, scheduledCount),
    offFreeDays,
    offFreePct: percentOf(offFreeDays, recap.totalDays),
    incidentCount,
  };
}

export function buildActivityMatrix(recap: DateRangeRecapResult) {
  const dates = Array.from(new Set(recap.dailyRows.map((r) => r.reportDate))).sort();
  const cellByKey = new Map<string, ReportCellStatus>();
  for (const row of recap.dailyRows) {
    cellByKey.set(`${row.locationId}:${row.reportDate}`, row.status);
  }
  const rows = recap.locationSummaries.map((loc) => {
    const cells: Record<string, ReportCellStatus> = {};
    for (const d of dates) {
      cells[d] = cellByKey.get(`${loc.locationId}:${d}`) ?? "UNREPORTED";
    }
    return {
      locationId: loc.locationId,
      displayName: loc.displayName,
      category: loc.category,
      cells,
      activePct: percentOf(loc.onDays, recap.totalDays),
    };
  });
  return { dates, rows };
}

export function buildAuditRows(recap: DateRangeRecapResult) {
  return recap.locationSummaries.map((loc, index) => {
    const latestOff = [...recap.dailyRows]
      .filter(
        (r) => r.locationId === loc.locationId && r.status === "OFF" && r.notes
      )
      .sort((a, b) => b.reportDate.localeCompare(a.reportDate))[0];
    return {
      no: index + 1,
      locationId: loc.locationId,
      displayName: loc.displayName,
      category: loc.category,
      onDays: loc.onDays,
      offDays: loc.offDays,
      unreportedDays: loc.unreportedDays,
      activePct: percentOf(loc.onDays, recap.totalDays),
      latestNote: latestOff ? `[${latestOff.reportDate}] ${latestOff.notes}` : null,
    };
  });
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function getLastDayOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export type RangePresetType = "today" | "7d" | "30d" | "month" | "week";

export function getRangePreset(
  preset: RangePresetType,
  today: string
): { startDate: string; endDate: string } {
  if (preset === "today") return { startDate: today, endDate: today };
  if (preset === "7d") {
    return { startDate: shiftDate(today, -6), endDate: today };
  }
  if (preset === "30d") {
    return { startDate: shiftDate(today, -29), endDate: today };
  }
  if (preset === "month") {
    return { startDate: `${today.slice(0, 7)}-01`, endDate: getLastDayOfMonth(today) };
  }
  const [y, m, d] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const sinceMonday = (weekday + 6) % 7;
  return { startDate: shiftDate(today, -sinceMonday), endDate: today };
}

export function detectActivePreset(
  startDate: string,
  endDate: string,
  today: string
): "today" | "7d" | "30d" | "month" | "custom" {
  if (startDate === today && endDate === today) {
    return "today";
  }
  if (startDate === shiftDate(today, -6) && endDate === today) {
    return "7d";
  }
  if (startDate === shiftDate(today, -29) && endDate === today) {
    return "30d";
  }
  if (
    startDate === `${today.slice(0, 7)}-01` &&
    endDate === getLastDayOfMonth(today)
  ) {
    return "month";
  }
  return "custom";
}

export function filterDashboardItems<
  T extends { category: string; displayName: string; notes: string | null },
>(items: T[], category: string, query: string): T[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "ALL" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.displayName.toLowerCase().includes(q) ||
      (item.notes ?? "").toLowerCase().includes(q)
    );
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total: items.length,
  };
}
