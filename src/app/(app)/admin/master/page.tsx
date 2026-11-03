import React from "react";
import { redirect } from "next/navigation";
import { auth, type SessionUser } from "@/lib/auth";
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
    <div className="mx-auto max-w-7xl">
      <MasterDataManager locations={allLocations} users={allUsers} />
    </div>
  );
}
