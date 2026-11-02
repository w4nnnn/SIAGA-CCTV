"use server";

import { requireSessionUser } from "@/lib/auth";
import {
  getOperatorLocationsWithDateStatus,
  getOperatorReportHistory,
  submitBatchDailyReports,
  updateHistoricalReport,
} from "@/server/services/report.service";

export async function submitBatchDailyReportsAction(input: {
  reportDate: string;
  items: Array<{
    locationId: string;
    status: "ON" | "OFF";
    notes?: string | null;
  }>;
}) {
  const user = await requireSessionUser();
  return submitBatchDailyReports(user, input);
}

export async function updateHistoricalReportAction(
  reportId: string,
  input: {
    status: "ON" | "OFF";
    notes?: string | null;
  }
) {
  const user = await requireSessionUser();
  return updateHistoricalReport(user, reportId, input);
}

export async function getOperatorLocationsWithDateStatusAction(
  reportDate: string
) {
  const user = await requireSessionUser();
  return getOperatorLocationsWithDateStatus(user, reportDate);
}

export async function getOperatorReportHistoryAction(filters?: {
  locationId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const user = await requireSessionUser();
  return getOperatorReportHistory(user, filters);
}
