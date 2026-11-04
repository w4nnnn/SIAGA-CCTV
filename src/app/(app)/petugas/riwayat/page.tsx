import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { getLastDayOfMonth } from "@/lib/view-models";
import { ReportHistoryTable } from "@/components/petugas/ReportHistoryTable";
import {
  getAssignedLocationsForUser,
  getOperatorReportHistory,
} from "@/server/services/report.service";

export default async function PetugasHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    locationId?: string;
    status?: "ALL" | "ON" | "OFF" | "UNREPORTED";
  }>;
}) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const todayStr = getTodayDateInJakarta();
  const defaultStartDate = `${todayStr.slice(0, 7)}-01`;
  const defaultEndDate = getLastDayOfMonth(todayStr);

  const startDate =
    params.startDate && /^\d{4}-\d{2}-\d{2}$/.test(params.startDate)
      ? params.startDate
      : defaultStartDate;
  const endDate =
    params.endDate && /^\d{4}-\d{2}-\d{2}$/.test(params.endDate)
      ? params.endDate
      : defaultEndDate;

  const [locations, historyItems] = await Promise.all([
    getAssignedLocationsForUser(user),
    getOperatorReportHistory(user, {
      startDate,
      endDate,
      locationId:
        params.locationId && params.locationId !== "ALL"
          ? params.locationId
          : undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <ReportHistoryTable
        key={`${startDate}-${endDate}-${params.locationId ?? "ALL"}-${params.status ?? "ALL"}`}
        locations={locations}
        items={historyItems}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialLocationId={params.locationId ?? "ALL"}
        initialStatus={params.status ?? "ALL"}
      />
    </div>
  );
}
