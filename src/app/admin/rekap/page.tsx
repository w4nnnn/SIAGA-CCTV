import React from "react";
import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";
import { getTodayDateInJakarta } from "@/lib/ui-state";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { DateRangeRecapView } from "@/components/admin/DateRangeRecapView";
import { listLocations } from "@/server/services/location.service";
import { getDateRangeRecap } from "@/server/services/recap.service";

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
  if (user.role !== "ADMIN") {
    redirect("/petugas");
  }

  const params = await searchParams;
  const todayStr = getTodayDateInJakarta();
  const firstDayOfMonth = `${todayStr.slice(0, 7)}-01`;

  const startDate =
    params.startDate && /^\d{4}-\d{2}-\d{2}$/.test(params.startDate)
      ? params.startDate
      : firstDayOfMonth;
  const endDate =
    params.endDate && /^\d{4}-\d{2}-\d{2}$/.test(params.endDate)
      ? params.endDate
      : todayStr;

  const [recap, activeLocations] = await Promise.all([
    getDateRangeRecap({
      startDate,
      endDate,
      locationId: params.locationId,
      status: params.status ?? "ALL",
    }),
    listLocations({ activeOnly: true }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
            Rekapitulasi Rentang Waktu &amp; Export Bulanan
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Filter laporan berdasarkan periode tanggal dan unduh rekap resmi dalam format Excel (.xlsx) atau PDF (.pdf).
          </p>
        </div>

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
      </main>
    </div>
  );
}
