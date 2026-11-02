import React from "react";
import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { AppNavbar } from "@/components/layout/AppNavbar";
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
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
            Input Laporan Harian CCTV
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Pilih status ON atau Ada Kendala / OFF untuk seluruh lokasi Anda sekaligus dalam satu kali simpan.
          </p>
        </div>

        <BatchReportForm
          key={reportDate}
          reportDate={reportDate}
          initialLocations={locationsWithStatus}
        />
      </main>
    </div>
  );
}
