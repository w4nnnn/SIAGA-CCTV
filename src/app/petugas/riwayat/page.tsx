import React from "react";
import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";
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
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
            Riwayat &amp; Koreksi Laporan
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Klik tombol Edit pada baris laporan jika terdapat pembaruan kondisi atau perbaikan CCTV.
          </p>
        </div>

        <ReportHistoryTable items={historyItems} />
      </main>
    </div>
  );
}
