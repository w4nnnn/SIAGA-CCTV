import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, locations, users } from "@/db/schema";
import { assertCanAccessLocations, SessionUser } from "@/lib/auth";
import { formatLocationDisplayName } from "@/lib/format";
import {
  batchReportInputSchema,
  updateReportInputSchema,
} from "@/lib/validators";
import { getUserAssignedLocationIds } from "./user.service";

export function prepareBatchReportRecords(
  user: SessionUser,
  assignedLocationIds: string[],
  input: {
    reportDate: string;
    items: Array<{
      locationId: string;
      status: "ON" | "OFF";
      notes?: string | null;
    }>;
  }
) {
  const parsed = batchReportInputSchema.parse(input);
  const requestedIds = parsed.items.map((i) => i.locationId);

  assertCanAccessLocations(user, requestedIds, assignedLocationIds);

  const dedupedByLocation = new Map<
    string,
    {
      locationId: string;
      reportDate: string;
      status: "ON" | "OFF";
      notes: string | null;
      reportedBy: string;
      updatedBy: string;
    }
  >();

  for (const item of parsed.items) {
    dedupedByLocation.set(item.locationId, {
      locationId: item.locationId,
      reportDate: parsed.reportDate,
      status: item.status,
      notes: item.notes,
      reportedBy: user.id,
      updatedBy: user.id,
    });
  }

  return Array.from(dedupedByLocation.values());
}

export function prepareUpdatedReportRecord(
  user: SessionUser,
  assignedLocationIds: string[],
  existingReport: {
    id: string;
    locationId: string;
    status: "ON" | "OFF";
    notes: string | null;
  },
  input: {
    status: "ON" | "OFF";
    notes?: string | null;
  }
) {
  assertCanAccessLocations(user, [existingReport.locationId], assignedLocationIds);
  const parsed = updateReportInputSchema.parse(input);

  return {
    id: existingReport.id,
    locationId: existingReport.locationId,
    status: parsed.status,
    notes: parsed.notes,
    updatedBy: user.id,
    updatedAt: new Date(),
  };
}

export async function submitBatchDailyReports(
  user: SessionUser,
  input: {
    reportDate: string;
    items: Array<{
      locationId: string;
      status: "ON" | "OFF";
      notes?: string | null;
    }>;
  }
) {
  const assignedIds =
    user.role === "ADMIN" ? [] : await getUserAssignedLocationIds(user.id);
  const records = prepareBatchReportRecords(user, assignedIds, input);

  return db
    .insert(dailyReports)
    .values(records)
    .onConflictDoUpdate({
      target: [dailyReports.locationId, dailyReports.reportDate],
      set: {
        status: sql.raw(`excluded.${dailyReports.status.name}`),
        notes: sql.raw(`excluded.${dailyReports.notes.name}`),
        updatedBy: sql.raw(`excluded.${dailyReports.updatedBy.name}`),
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function updateHistoricalReport(
  user: SessionUser,
  reportId: string,
  input: {
    status: "ON" | "OFF";
    notes?: string | null;
  }
) {
  const [existing] = await db
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.id, reportId))
    .limit(1);

  if (!existing) {
    throw new Error("Data laporan tidak ditemukan");
  }

  const assignedIds =
    user.role === "ADMIN" ? [] : await getUserAssignedLocationIds(user.id);
  const updatePayload = prepareUpdatedReportRecord(
    user,
    assignedIds,
    existing,
    input
  );

  const [updated] = await db
    .update(dailyReports)
    .set({
      status: updatePayload.status,
      notes: updatePayload.notes,
      updatedBy: updatePayload.updatedBy,
      updatedAt: updatePayload.updatedAt,
    })
    .where(eq(dailyReports.id, reportId))
    .returning();

  return updated;
}

export async function getOperatorLocationsWithDateStatus(
  user: SessionUser,
  reportDate: string
) {
  const assignedIds =
    user.role === "ADMIN" ? null : await getUserAssignedLocationIds(user.id);

  if (assignedIds !== null && assignedIds.length === 0) {
    return [];
  }

  const locationRows =
    assignedIds === null
      ? await db
          .select()
          .from(locations)
          .where(eq(locations.isActive, true))
          .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name))
      : await db
          .select()
          .from(locations)
          .where(
            and(
              eq(locations.isActive, true),
              inArray(locations.id, assignedIds)
            )
          )
          .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name));

  if (locationRows.length === 0) {
    return [];
  }

  const reportRows = await db
    .select()
    .from(dailyReports)
    .where(
      and(
        eq(dailyReports.reportDate, reportDate),
        inArray(
          dailyReports.locationId,
          locationRows.map((l) => l.id)
        )
      )
    );

  const reportByLocation = new Map(
    reportRows.map((r) => [r.locationId, r])
  );

  return locationRows.map((loc) => {
    const existing = reportByLocation.get(loc.id) ?? null;
    return {
      locationId: loc.id,
      category: loc.category,
      name: loc.name,
      displayName: formatLocationDisplayName(loc),
      sortOrder: loc.sortOrder,
      report: existing
        ? {
            id: existing.id,
            status: existing.status,
            notes: existing.notes,
            updatedAt: existing.updatedAt,
          }
        : null,
    };
  });
}

export async function getOperatorReportHistory(
  user: SessionUser,
  filters?: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const assignedIds =
    user.role === "ADMIN" ? null : await getUserAssignedLocationIds(user.id);

  if (assignedIds !== null && assignedIds.length === 0) {
    return [];
  }

  const conditions = [];
  if (assignedIds !== null) {
    conditions.push(inArray(dailyReports.locationId, assignedIds));
  }
  if (filters?.locationId) {
    if (assignedIds !== null) {
      assertCanAccessLocations(user, [filters.locationId], assignedIds);
    }
    conditions.push(eq(dailyReports.locationId, filters.locationId));
  }
  if (filters?.startDate) {
    conditions.push(gte(dailyReports.reportDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(dailyReports.reportDate, filters.endDate));
  }

  const rows = await db
    .select({
      id: dailyReports.id,
      locationId: dailyReports.locationId,
      reportDate: dailyReports.reportDate,
      status: dailyReports.status,
      notes: dailyReports.notes,
      updatedAt: dailyReports.updatedAt,
      category: locations.category,
      name: locations.name,
      reporterName: users.name,
    })
    .from(dailyReports)
    .innerJoin(locations, eq(dailyReports.locationId, locations.id))
    .leftJoin(users, eq(dailyReports.reportedBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailyReports.reportDate), asc(locations.sortOrder));

  return rows.map((row) => ({
    ...row,
    displayName: formatLocationDisplayName({
      category: row.category,
      name: row.name,
    }),
  }));
}
