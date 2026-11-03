import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { DailyMonitoringBoard } from "@/components/admin/DailyMonitoringBoard";
import { getDailyMonitoringSummary } from "@/server/services/recap.service";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/petugas");
  }

  const params = await searchParams;
  const todayStr = getTodayDateInJakarta();
  const reportDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayStr;

  const summary = await getDailyMonitoringSummary(reportDate);

  return (
    <div className="mx-auto max-w-7xl">
      <DailyMonitoringBoard key={reportDate} summary={summary} />
    </div>
  );
}
