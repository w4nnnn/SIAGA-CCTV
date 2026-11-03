import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
import { ReportHistoryTable } from "@/components/petugas/ReportHistoryTable";
import { getOperatorReportHistory } from "@/server/services/report.service";

export default async function PetugasHistoryPage() {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    redirect("/login");
  }

  const historyItems = await getOperatorReportHistory(user);

  return (
    <div className="mx-auto max-w-5xl">
      <ReportHistoryTable items={historyItems} />
    </div>
  );
}
