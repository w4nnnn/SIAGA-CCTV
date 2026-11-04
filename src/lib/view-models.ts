import type {
  DateRangeRecapResult,
  DailyMonitoringSummary,
} from "@/server/services/recap.service";
import { formatIndonesianMonthYear } from "@/lib/format";

export type ReportCellStatus = "ON" | "OFF" | "UNREPORTED";

export interface MonthColumnGroup {
  monthKey: string;
  monthLabel: string;
  dates: Array<{
    dateStr: string;
    dayLabel: string;
  }>;
}

export function enumerateDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate || startDate > endDate) return [];
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur.getTime() <= end.getTime()) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cur.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export function groupDatesByMonth(dates: string[]): MonthColumnGroup[] {
  const groups: MonthColumnGroup[] = [];
  for (const dateStr of dates) {
    const monthKey = dateStr.slice(0, 7);
    const dayLabel = dateStr.slice(8, 10);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.monthKey === monthKey) {
      lastGroup.dates.push({ dateStr, dayLabel });
    } else {
      groups.push({
        monthKey,
        monthLabel: formatIndonesianMonthYear(monthKey),
        dates: [{ dateStr, dayLabel }],
      });
    }
  }
  return groups;
}

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
  const dates =
    recap.startDate && recap.endDate
      ? enumerateDateRange(recap.startDate, recap.endDate)
      : Array.from(new Set(recap.dailyRows.map((r) => r.reportDate))).sort();
  const monthGroups = groupDatesByMonth(dates);
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
  return { dates, monthGroups, rows };
}

export interface OperatorHistoryCell {
  dateStr: string;
  status: ReportCellStatus;
  reportId: string | null;
  notes: string | null;
  reporterName: string | null;
  updatedAt: Date | null;
}

export interface OperatorHistoryRow {
  locationId: string;
  category: string;
  name: string;
  displayName: string;
  cells: Record<string, OperatorHistoryCell>;
  onDays: number;
  offDays: number;
  unreportedDays: number;
  activePct: number;
}

export function buildOperatorHistoryMatrix({
  locations,
  reports,
  startDate,
  endDate,
  statusFilter = "ALL",
}: {
  locations: Array<{
    id: string;
    category?: string;
    name?: string;
    displayName: string;
  }>;
  reports: Array<{
    id: string;
    locationId: string;
    reportDate: string;
    status: "ON" | "OFF";
    notes: string | null;
    reporterName?: string | null;
    updatedAt?: Date | null;
  }>;
  startDate: string;
  endDate: string;
  statusFilter?: string;
}) {
  const dates = enumerateDateRange(startDate, endDate);
  const monthGroups = groupDatesByMonth(dates);
  const reportByKey = new Map<
    string,
    {
      id: string;
      status: "ON" | "OFF";
      notes: string | null;
      reporterName: string | null;
      updatedAt: Date | null;
    }
  >();

  for (const rep of reports) {
    reportByKey.set(`${rep.locationId}:${rep.reportDate}`, {
      id: rep.id,
      status: rep.status,
      notes: rep.notes,
      reporterName: rep.reporterName ?? null,
      updatedAt: rep.updatedAt ?? null,
    });
  }

  const allRows: OperatorHistoryRow[] = locations.map((loc) => {
    const cells: Record<string, OperatorHistoryCell> = {};
    let onDays = 0;
    let offDays = 0;
    let unreportedDays = 0;

    for (const d of dates) {
      const existing = reportByKey.get(`${loc.id}:${d}`);
      if (existing) {
        cells[d] = {
          dateStr: d,
          status: existing.status,
          reportId: existing.id,
          notes: existing.notes,
          reporterName: existing.reporterName,
          updatedAt: existing.updatedAt,
        };
        if (existing.status === "ON") onDays += 1;
        else offDays += 1;
      } else {
        cells[d] = {
          dateStr: d,
          status: "UNREPORTED",
          reportId: null,
          notes: null,
          reporterName: null,
          updatedAt: null,
        };
        unreportedDays += 1;
      }
    }

    const totalDays = dates.length;
    return {
      locationId: loc.id,
      category: loc.category ?? "",
      name: loc.name ?? loc.displayName,
      displayName: loc.displayName,
      cells,
      onDays,
      offDays,
      unreportedDays,
      activePct: percentOf(onDays, totalDays),
    };
  });

  const filteredRows =
    statusFilter === "ALL"
      ? allRows
      : allRows.filter((row) =>
          dates.some((d) => row.cells[d]?.status === statusFilter)
        );

  return { dates, monthGroups, rows: filteredRows };
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
