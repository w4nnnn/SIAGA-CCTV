import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { BatchReportForm } from "@/components/petugas/BatchReportForm";
import { getOperatorLocationsWithDateStatus } from "@/server/services/report.service";

export default async function PetugasInputPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const todayStr = getTodayDateInJakarta();
  const reportDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayStr;

  const locationsWithStatus = await getOperatorLocationsWithDateStatus(
    user,
    reportDate
  );

  return (
    <div className="mx-auto max-w-5xl">
      <BatchReportForm
        key={reportDate}
        reportDate={reportDate}
        initialLocations={locationsWithStatus}
        officerName={user.name}
        officerRole={user.role}
      />
    </div>
  );
}
