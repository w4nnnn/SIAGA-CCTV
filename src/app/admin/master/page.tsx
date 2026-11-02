import React from "react";
import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { MasterDataManager } from "@/components/admin/MasterDataManager";
import { listLocations } from "@/server/services/location.service";
import { listUsersWithLocations } from "@/server/services/user.service";

export default async function AdminMasterPage() {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/petugas");
  }

  const [allLocations, allUsers] = await Promise.all([
    listLocations(),
    listUsersWithLocations(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl font-bold text-[var(--color-foreground)]">
            Manajemen Master Lokasi &amp; Pengguna
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Kelola daftar lokasi (Kategori + Nama Tempat) dan atur penugasan lokasi untuk masing-masing akun petugas.
          </p>
        </div>

        <MasterDataManager locations={allLocations} users={allUsers} />
      </main>
    </div>
  );
}
