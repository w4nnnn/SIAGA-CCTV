import React from "react";
import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { DailyMonitoringBoard } from "@/components/admin/DailyMonitoringBoard";
import {
  formatWhatsAppDailyReport,
  getDailyMonitoringSummary,
} from "@/server/services/recap.service";

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
  const todayStr = new Date().toISOString().slice(0, 10);
  const reportDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : todayStr;

  const summary = await getDailyMonitoringSummary(reportDate);
  const whatsAppText = formatWhatsAppDailyReport(summary);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
            Dashboard Pemantauan Harian CCTV
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Pantau status pelaporan seluruh lokasi secara real-time dan salin rekap format WhatsApp.
          </p>
        </div>

        <DailyMonitoringBoard
          key={reportDate}
          summary={summary}
          whatsAppText={whatsAppText}
        />
      </main>
    </div>
  );
}
