import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, locations, users } from "@/db/schema";
import {
  formatIndonesianDateHeader,
  formatLocationDisplayName,
} from "@/lib/format";
import { recapFilterSchema } from "@/lib/validators";

export interface LocationItem {
  id: string;
  category: string;
  name: string;
  sortOrder: number;
}

export interface DailyReportItem {
  locationId: string;
  status: "ON" | "OFF";
  notes: string | null;
  updatedAt?: Date;
}

export interface DailyMonitoringItem {
  locationId: string;
  category: string;
  name: string;
  displayName: string;
  sortOrder: number;
  status: "ON" | "OFF" | "UNREPORTED";
  notes: string | null;
}

export interface DailyMonitoringSummary {
  reportDate: string;
  counts: {
    totalLocations: number;
    onCount: number;
    offCount: number;
    unreportedCount: number;
  };
  items: DailyMonitoringItem[];
}

export interface DateRangeReportRowInput {
  locationId: string;
  reportDate: string;
  status: "ON" | "OFF";
  notes: string | null;
  reporterName?: string | null;
}

export interface DateRangeLocationSummary {
  locationId: string;
  category: string;
  name: string;
  displayName: string;
  sortOrder: number;
  onDays: number;
  offDays: number;
  unreportedDays: number;
}

export interface DateRangeDailyRow {
  reportDate: string;
  locationId: string;
  category: string;
  name: string;
  displayName: string;
  status: "ON" | "OFF" | "UNREPORTED";
  notes: string | null;
  reporterName: string | null;
}

export interface DateRangeRecapResult {
  startDate: string;
  endDate: string;
  totalDays: number;
  locationSummaries: DateRangeLocationSummary[];
  dailyRows: DateRangeDailyRow[];
}

function sortLocations(locs: LocationItem[]): LocationItem[] {
  return [...locs].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });
}

function enumerateDatesBetween(startDate: string, endDate: string): string[] {
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

export function buildDailyMonitoringRecap(
  reportDate: string,
  activeLocations: LocationItem[],
  reportsForDate: DailyReportItem[]
): DailyMonitoringSummary {
  const sortedLocations = sortLocations(activeLocations);
  const reportByLocation = new Map(
    reportsForDate.map((r) => [r.locationId, r])
  );

  let onCount = 0;
  let offCount = 0;
  let unreportedCount = 0;

  const items: DailyMonitoringItem[] = sortedLocations.map((loc) => {
    const rep = reportByLocation.get(loc.id);
    const displayName = formatLocationDisplayName(loc);
    if (!rep) {
      unreportedCount += 1;
      return {
        locationId: loc.id,
        category: loc.category,
        name: loc.name,
        displayName,
        sortOrder: loc.sortOrder,
        status: "UNREPORTED",
        notes: null,
      };
    }

    if (rep.status === "ON") {
      onCount += 1;
    } else {
      offCount += 1;
    }

    return {
      locationId: loc.id,
      category: loc.category,
      name: loc.name,
      displayName,
      sortOrder: loc.sortOrder,
      status: rep.status,
      notes: rep.status === "OFF" ? rep.notes : null,
    };
  });

  return {
    reportDate,
    counts: {
      totalLocations: sortedLocations.length,
      onCount,
      offCount,
      unreportedCount,
    },
    items,
  };
}

export function formatWhatsAppDailyReport(
  summary: DailyMonitoringSummary
): string {
  const headerDate = formatIndonesianDateHeader(summary.reportDate);
  const lines = [
    "Laporan Harian CCTV",
    headerDate,
    "============================",
  ];

  for (const item of summary.items) {
    if (item.status === "ON") {
      lines.push(`${item.displayName} : On semua.`);
    } else if (item.status === "OFF") {
      if (item.notes && item.notes.trim().length > 0) {
        const trimmed = item.notes.trim();
        const suffix = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
        lines.push(`${item.displayName} : ${suffix}`);
      } else {
        lines.push(`${item.displayName} : Ada Kendala / Off.`);
      }
    } else {
      lines.push(`${item.displayName} : Belum Lapor.`);
    }
  }

  return lines.join("\n");
}

export function buildDateRangeRecap(
  filterInput: {
    startDate: string;
    endDate: string;
    locationId?: string;
    status?: "ALL" | "ON" | "OFF" | "UNREPORTED";
  },
  activeLocations: LocationItem[],
  reportsInRange: DateRangeReportRowInput[]
): DateRangeRecapResult {
  const filter = recapFilterSchema.parse(filterInput);
  const dates = enumerateDatesBetween(filter.startDate, filter.endDate);
  const filteredLocations = sortLocations(
    filter.locationId
      ? activeLocations.filter((l) => l.id === filter.locationId)
      : activeLocations
  );

  const reportMap = new Map<string, DateRangeReportRowInput>();
  for (const rep of reportsInRange) {
    reportMap.set(`${rep.locationId}:${rep.reportDate}`, rep);
  }

  const locationSummaries: DateRangeLocationSummary[] = [];
  const dailyRows: DateRangeDailyRow[] = [];

  for (const loc of filteredLocations) {
    let onDays = 0;
    let offDays = 0;
    let unreportedDays = 0;
    const displayName = formatLocationDisplayName(loc);

    for (const dateStr of dates) {
      const rep = reportMap.get(`${loc.id}:${dateStr}`);
      const status: "ON" | "OFF" | "UNREPORTED" = rep
        ? rep.status
        : "UNREPORTED";

      if (status === "ON") onDays += 1;
      else if (status === "OFF") offDays += 1;
      else unreportedDays += 1;

      if (filter.status === "ALL" || filter.status === status) {
        dailyRows.push({
          reportDate: dateStr,
          locationId: loc.id,
          category: loc.category,
          name: loc.name,
          displayName,
          status,
          notes: status === "OFF" ? (rep?.notes ?? null) : null,
          reporterName: rep?.reporterName ?? null,
        });
      }
    }

    locationSummaries.push({
      locationId: loc.id,
      category: loc.category,
      name: loc.name,
      displayName,
      sortOrder: loc.sortOrder,
      onDays,
      offDays,
      unreportedDays,
    });
  }

  dailyRows.sort((a, b) => {
    if (a.reportDate !== b.reportDate) {
      return a.reportDate.localeCompare(b.reportDate);
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return {
    startDate: filter.startDate,
    endDate: filter.endDate,
    totalDays: dates.length,
    locationSummaries,
    dailyRows,
  };
}

export async function getDailyMonitoringSummary(
  reportDate: string
): Promise<DailyMonitoringSummary> {
  const activeLocs = await db
    .select()
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name));

  const reports = await db
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.reportDate, reportDate));

  return buildDailyMonitoringRecap(reportDate, activeLocs, reports);
}

export async function getDateRangeRecap(filterInput: {
  startDate: string;
  endDate: string;
  locationId?: string;
  status?: "ALL" | "ON" | "OFF" | "UNREPORTED";
}): Promise<DateRangeRecapResult> {
  const filter = recapFilterSchema.parse(filterInput);
  const activeLocs = await db
    .select()
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name));

  const reportRows = await db
    .select({
      locationId: dailyReports.locationId,
      reportDate: dailyReports.reportDate,
      status: dailyReports.status,
      notes: dailyReports.notes,
      reporterName: users.name,
    })
    .from(dailyReports)
    .leftJoin(users, eq(dailyReports.updatedBy, users.id))
    .where(
      and(
        gte(dailyReports.reportDate, filter.startDate),
        lte(dailyReports.reportDate, filter.endDate)
      )
    );

  return buildDateRangeRecap(filter, activeLocs, reportRows);
}
