import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { DateRangeRecapView } from "@/components/admin/DateRangeRecapView";
import { listLocations } from "@/server/services/location.service";
import { getAssignedLocationsForUser } from "@/server/services/report.service";
import { getDateRangeRecap } from "@/server/services/recap.service";

import { getLastDayOfMonth } from "@/lib/view-models";

export default async function AdminRecapPage({
  searchParams,
}: {
  searchParams: Promise<{
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

  const params = await searchParams;
  const todayStr = getTodayDateInJakarta();
  const firstDayOfMonth = `${todayStr.slice(0, 7)}-01`;
  const lastDayOfMonth = getLastDayOfMonth(todayStr);

  const startDate =
    params.startDate && /^\d{4}-\d{2}-\d{2}$/.test(params.startDate)
      ? params.startDate
      : firstDayOfMonth;
  const endDate =
    params.endDate && /^\d{4}-\d{2}-\d{2}$/.test(params.endDate)
      ? params.endDate
      : lastDayOfMonth;

  const [recap, activeLocations] = await Promise.all([
    getDateRangeRecap(
      {
        startDate,
        endDate,
        locationId: params.locationId,
        status: params.status ?? "ALL",
      },
      user
    ),
    user.role === "ADMIN"
      ? listLocations({ activeOnly: true })
      : getAssignedLocationsForUser(user),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <DateRangeRecapView
        key={`${startDate}-${endDate}-${params.locationId ?? ""}-${params.status ?? "ALL"}`}
        recap={recap}
        locations={activeLocations.map((l) => ({
          id: l.id,
          displayName: l.displayName,
        }))}
        initialLocationId={params.locationId}
        initialStatus={params.status ?? "ALL"}
      />
    </div>
  );
}
