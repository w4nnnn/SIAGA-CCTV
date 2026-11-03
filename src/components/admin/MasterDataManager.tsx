"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { formatLocationDisplayName } from "@/lib/format";
import { toggleLocationIdInSelection } from "@/lib/ui-state";
import {
  createLocationAction,
  updateLocationAction,
} from "@/server/actions/location.actions";
import {
  createUserAction,
  updateUserLocationsAction,
} from "@/server/actions/user.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryBadge } from "@/components/common/StatusBadge";
import { SimpleSelect } from "@/components/common/SimpleSelect";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface LocationRecord {
  id: string;
  category: string;
  name: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "PETUGAS";
  isActive?: boolean;
  assignedLocations: Array<{ locationId: string; displayName: string }>;
}

export function MasterDataManager({
  locations,
  users,
}: {
  locations: LocationRecord[];
  users: UserRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState("locations");

  // Filters Tab Lokasi
  const [locSearch, setLocSearch] = useState("");
  const [locCategoryFilter, setLocCategoryFilter] = useState("ALL");
  const [locStatusFilter, setLocStatusFilter] = useState("ALL");

  // Filters Tab Akun
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  // Dialog Tambah Lokasi
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [category, setCategory] = useState("IT");
  const [placeName, setPlaceName] = useState("");
  const [sortOrder, setSortOrder] = useState(locations.length + 1);
  const [confirmLocOpen, setConfirmLocOpen] = useState(false);

  // Dialog Tambah Pengguna
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PETUGAS" | "ADMIN">("PETUGAS");
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);

  // Dialog Edit Penugasan Petugas
  const [assignUser, setAssignUser] = useState<UserRecord | null>(null);
  const [assignLocIds, setAssignLocIds] = useState<string[]>([]);

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Kategori unik untuk filter
  const categoryOptions = useMemo(() => {
    const set = new Set(locations.map((l) => l.category));
    return [
      { value: "ALL", label: "Semua Kategori" },
      ...Array.from(set)
        .sort()
        .map((c) => ({ value: c, label: c })),
    ];
  }, [locations]);

  // Map PIC per lokasi
  const picByLocationId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const u of users) {
      if (u.role === "PETUGAS") {
        for (const loc of u.assignedLocations) {
          const list = map.get(loc.locationId) ?? [];
          list.push(u.name);
          map.set(loc.locationId, list);
        }
      }
    }
    return map;
  }, [users]);

  // KPI Calculations
  const totalLocations = locations.length;
  const activeLocationsCount = locations.filter((l) => l.isActive).length;
  const totalUsers = users.length;
  const assignedLocationsCount = useMemo(() => {
    const assignedSet = new Set<string>();
    for (const u of users) {
      for (const loc of u.assignedLocations) {
        assignedSet.add(loc.locationId);
      }
    }
    return assignedSet.size;
  }, [users]);

  const coveragePct =
    totalLocations > 0
      ? Math.round((assignedLocationsCount / totalLocations) * 100)
      : 0;

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    const q = locSearch.trim().toLowerCase();
    return locations.filter((loc) => {
      if (locCategoryFilter !== "ALL" && loc.category !== locCategoryFilter) {
        return false;
      }
      if (locStatusFilter === "ACTIVE" && !loc.isActive) return false;
      if (locStatusFilter === "INACTIVE" && loc.isActive) return false;
      if (!q) return true;
      const pics = (picByLocationId.get(loc.id) ?? []).join(" ").toLowerCase();
      return (
        loc.displayName.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        pics.includes(q)
      );
    });
  }, [locations, locSearch, locCategoryFilter, locStatusFilter, picByLocationId]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userRoleFilter !== "ALL" && u.role !== userRoleFilter) return false;
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.assignedLocations.some((l) => l.displayName.toLowerCase().includes(q))
      );
    });
  }, [users, userSearch, userRoleFilter]);

  const previewLabel = placeName.trim()
    ? formatLocationDisplayName({ category, name: placeName })
    : `${category} [Nama Tempat]`;

  // Submit Add Location
  const executeAddLocation = () => {
    setConfirmLocOpen(false);
    setFeedback(null);

    startTransition(async () => {
      try {
        await createLocationAction({
          category,
          name: placeName,
          sortOrder: Number(sortOrder) || 0,
        });
        setPlaceName("");
        setSortOrder((prev) => prev + 1);
        setAddLocOpen(false);
        const msg = `Lokasi "${category} ${placeName}" berhasil ditambahkan.`;
        setFeedback({
          type: "success",
          message: msg,
        });
        toast.success(msg);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal menambah lokasi.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    });
  };

  // Submit Add User
  const executeAddUser = () => {
    setConfirmUserOpen(false);
    setFeedback(null);

    startTransition(async () => {
      try {
        await createUserAction({
          username,
          name: fullName,
          password,
          role,
          locationIds: role === "PETUGAS" ? selectedLocIds : [],
        });
        const msg = `Akun "${username}" (${role}) berhasil dibuat.`;
        setUsername("");
        setFullName("");
        setPassword("");
        setSelectedLocIds([]);
        setAddUserOpen(false);
        setFeedback({
          type: "success",
          message: msg,
        });
        toast.success(msg);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal membuat akun pengguna.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    });
  };

  // Toggle Status Aktif Lokasi
  const handleToggleLocationActive = (loc: LocationRecord) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await updateLocationAction(loc.id, { isActive: !loc.isActive });
        const msg = `Status ${loc.displayName} diubah menjadi ${
          !loc.isActive ? "Aktif" : "Nonaktif"
        }.`;
        setFeedback({
          type: "success",
          message: msg,
        });
        toast.success(msg);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal memperbarui status lokasi.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    });
  };

  // Open Edit Penugasan
  const openAssignModal = (u: UserRecord) => {
    setAssignUser(u);
    setAssignLocIds(u.assignedLocations.map((l) => l.locationId));
  };

  // Submit Penugasan
  const executeSaveAssignment = () => {
    if (!assignUser) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateUserLocationsAction(assignUser.id, assignLocIds);
        const msg = `Penugasan lokasi untuk ${assignUser.name} berhasil diperbarui.`;
        setAssignUser(null);
        setFeedback({
          type: "success",
          message: msg,
        });
        toast.success(msg);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal memperbarui penugasan lokasi.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Top Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-[0.25rem] bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground tracking-wider uppercase">
              Pengaturan Sistem &amp; Hak Akses
            </span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Master Data &amp; Pengaturan Operasional
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Kelola titik terminal, hierarki pelaporan WhatsApp, serta hak akses dan penugasan wilayah multi-lokasi petugas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFeedback(null);
              setAddUserOpen(true);
            }}
            className="h-9 cursor-pointer gap-2 rounded-[0.25rem] border-border font-heading text-xs font-semibold hover:bg-muted"
          >
            <UserPlus className="size-4" />
            <span>+ Tambah Pengguna</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setFeedback(null);
              setAddLocOpen(true);
            }}
            className="h-9 cursor-pointer gap-2 rounded-[0.25rem] bg-primary font-heading text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="size-4" />
            <span>+ Tambah Lokasi Baru</span>
          </Button>
        </div>
      </div>

      {/* KPI 3-Card Summary Grid */}
      <section
        aria-label="Ringkasan Master Data"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-primary bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Titik Lokasi
            </span>
            <Building2 className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {totalLocations}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Titik Terminal
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-status-on)]">
              {activeLocationsCount} Aktif
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-[var(--color-status-on-solid)] bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-status-on)]">
              Total Akun Pengguna
            </span>
            <Users className="size-4 text-[var(--color-status-on)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-[var(--color-status-on)] sm:text-3xl">
              {totalUsers}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Akun
              </span>
            </div>
            <span className="rounded-[0.25rem] border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {users.filter((u) => u.role === "PETUGAS").length} Petugas &bull;{" "}
              {users.filter((u) => u.role === "ADMIN").length} SPV
            </span>
          </div>
        </Card>

        <Card className="rounded-[0.5rem] border border-border border-t-[3px] border-t-primary bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cakupan Penugasan
            </span>
            <UserCheck className="size-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {coveragePct}%
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                Terisi
              </span>
            </div>
            <span
              className={cn(
                "rounded-[0.25rem] border px-2 py-0.5 text-[11px] font-semibold",
                coveragePct >= 100
                  ? "border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
                  : "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]"
              )}
            >
              {assignedLocationsCount} dari {totalLocations} Lokasi
            </span>
          </div>
        </Card>
      </section>

      {/* System Notice Box */}
      <div className="flex items-start gap-3 rounded-[0.5rem] border border-border bg-card p-4 text-xs shadow-xs">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[0.25rem] bg-secondary text-secondary-foreground">
          <Layers className="size-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-heading font-bold text-foreground">
            Arsitektur Many-to-Many &amp; Urutan Pelaporan:
          </span>
          <p className="text-muted-foreground">
            Satu akun petugas dapat mengelola beberapa terminal sekaligus (multi-lokasi). Nomor urut menentukan posisi kemunculan titik pada ringkasan harian WhatsApp, tabel pemantauan, dan ekspor resmi Excel/PDF.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-start gap-2.5 rounded-[0.25rem] border p-3.5 text-xs font-medium",
            feedback.type === "success"
              ? "border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
              : "border-[var(--color-status-off-border)] bg-[var(--color-status-off-surface)] text-[var(--color-status-off)]"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Primary Sub-Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="rounded-[0.25rem] border border-border bg-muted/40 p-1">
          <TabsTrigger
            value="locations"
            className="cursor-pointer rounded-[0.25rem] px-4 py-1.5 text-xs font-heading font-semibold data-active:bg-card data-active:text-foreground data-active:shadow-xs"
          >
            Master Lokasi Operasional ({locations.length})
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="cursor-pointer rounded-[0.25rem] px-4 py-1.5 text-xs font-heading font-semibold data-active:bg-card data-active:text-foreground data-active:shadow-xs"
          >
            Master Akun &amp; Hak Akses ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Lokasi */}
        <TabsContent value="locations" className="space-y-4">
          <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
            {/* Filter Bar Inline */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama lokasi, PIC, atau kode..."
                  value={locSearch}
                  onChange={(e) => setLocSearch(e.target.value)}
                  className="h-8 rounded-[0.25rem] pl-8 text-xs font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="w-40">
                  <SimpleSelect
                    value={locCategoryFilter}
                    onValueChange={setLocCategoryFilter}
                    options={categoryOptions}
                    className="h-8 rounded-[0.25rem] text-xs"
                  />
                </div>

                <div className="w-44">
                  <SimpleSelect
                    value={locStatusFilter}
                    onValueChange={setLocStatusFilter}
                    options={[
                      { value: "ALL", label: "Semua Status" },
                      { value: "ACTIVE", label: "Hanya Lokasi Aktif" },
                      { value: "INACTIVE", label: "Hanya Nonaktif" },
                    ]}
                    className="h-8 rounded-[0.25rem] text-xs"
                  />
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40">
                      <TableHead className="w-16 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Urutan
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Kategori
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Nama Tempat
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Nama Tampilan Laporan
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Petugas PIC Terassign
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Aktifkan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-xs text-muted-foreground"
                        >
                          Tidak ada data lokasi yang sesuai dengan pencarian atau filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations.map((loc) => {
                        const pics = picByLocationId.get(loc.id) ?? [];
                        return (
                          <TableRow
                            key={loc.id}
                            className="border-b border-border/70 hover:bg-muted/30"
                          >
                            <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                              #{loc.sortOrder}
                            </TableCell>
                            <TableCell>
                              <CategoryBadge category={loc.category} />
                            </TableCell>
                            <TableCell className="font-medium text-xs text-foreground">
                              {loc.name}
                            </TableCell>
                            <TableCell className="font-heading text-xs font-bold text-foreground">
                              {loc.displayName}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {pics.length > 0 ? (
                                <span className="font-medium text-foreground">
                                  {pics.join(", ")}
                                </span>
                              ) : (
                                <span className="italic text-muted-foreground">
                                  Belum ada petugas
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-[0.25rem] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                  loc.isActive
                                    ? "border border-[var(--color-status-on-border)] bg-[var(--color-status-on-surface)] text-[var(--color-status-on)]"
                                    : "border border-border bg-muted/60 text-muted-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    loc.isActive
                                      ? "bg-[var(--color-status-on-solid)]"
                                      : "bg-muted-foreground"
                                  )}
                                />
                                {loc.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={loc.isActive}
                                onCheckedChange={() =>
                                  handleToggleLocationActive(loc)
                                }
                                disabled={isPending}
                                aria-label={`Ubah status aktif ${loc.displayName}`}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Menampilkan {filteredLocations.length} dari {locations.length} lokasi
                </span>
                <span>Urutan otomatis tersimpan untuk pelaporan harian</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Akun & Hak Akses */}
        <TabsContent value="users" className="space-y-4">
          <Card className="rounded-[0.5rem] border border-border bg-card shadow-xs">
            {/* Filter Bar Inline */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari username atau nama..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-8 rounded-[0.25rem] pl-8 text-xs font-mono"
                />
              </div>

              <div className="w-48">
                <SimpleSelect
                  value={userRoleFilter}
                  onValueChange={setUserRoleFilter}
                  options={[
                    { value: "ALL", label: "Semua Role Akun" },
                    { value: "ADMIN", label: "ADMIN / Supervisor" },
                    { value: "PETUGAS", label: "PETUGAS Lapangan" },
                  ]}
                  className="h-8 rounded-[0.25rem] text-xs"
                />
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40">
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Username
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Nama Lengkap
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Role
                      </TableHead>
                      <TableHead className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Cakupan Lokasi Ditugaskan
                      </TableHead>
                      <TableHead className="text-right font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-xs text-muted-foreground"
                        >
                          Tidak ada data akun yang sesuai dengan pencarian atau filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          className="border-b border-border/70 hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-xs font-bold text-foreground whitespace-nowrap">
                            {u.username}
                          </TableCell>
                          <TableCell className="font-heading text-xs font-semibold text-foreground whitespace-nowrap">
                            {u.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant={u.role === "ADMIN" ? "default" : "secondary"}
                              className={cn(
                                "rounded-[0.25rem] text-[10px] font-mono",
                                u.role === "ADMIN" ? "bg-primary text-primary-foreground" : ""
                              )}
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {u.role === "ADMIN" ? (
                              <span className="font-semibold text-primary">
                                Seluruh Lokasi (Supervisi Regional)
                              </span>
                            ) : u.assignedLocations.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.assignedLocations.map((l) => (
                                  <span
                                    key={l.locationId}
                                    className="rounded-[0.25rem] border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                                  >
                                    {l.displayName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-muted-foreground">
                                Belum ada penugasan
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {u.role === "PETUGAS" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignModal(u)}
                                className="h-7 cursor-pointer gap-1.5 rounded-[0.25rem] border-border text-xs font-heading font-semibold hover:bg-muted"
                              >
                                <Pencil className="size-3" />
                                <span>Atur Penugasan</span>
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Akses Penuh
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Menampilkan {filteredUsers.length} dari {users.length} akun pengguna
                </span>
                <span>Role ADMIN memiliki izin pemantauan seluruh terminal</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Dialog: Tambah Lokasi Baru */}
      <Dialog open={addLocOpen} onOpenChange={setAddLocOpen}>
        <DialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Tambah Titik Lokasi Operasional Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Masukkan kategori terminal dan nama spesifik lokasi CCTV.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!category.trim() || !placeName.trim()) return;
              setConfirmLocOpen(true);
            }}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Kategori Lokasi</Label>
              <Input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                placeholder="IT / FT / AFT / LPG / BP"
                className="h-9 rounded-[0.25rem] font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Nama Tempat</Label>
              <Input
                type="text"
                required
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Contoh: Surabaya, Camplong, Bima"
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Nomor Urutan Tampil</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="h-9 rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-[0.25rem] border border-border bg-muted/40 p-2.5">
              <span className="text-muted-foreground">Pratinjau Label:</span>
              <span className="font-heading font-bold text-foreground">{previewLabel}</span>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddLocOpen(false)}
                className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
              >
                Lanjut Konfirmasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog: Tambah Lokasi */}
      <AlertDialog open={confirmLocOpen} onOpenChange={setConfirmLocOpen}>
        <AlertDialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-foreground">
              Konfirmasi Tambah Lokasi
            </AlertDialogTitle>
            <div className="space-y-2 pt-1 text-xs text-muted-foreground">
              <p>Apakah Anda yakin ingin menambahkan data lokasi baru berikut?</p>
              <div className="rounded-[0.25rem] border border-border bg-muted/40 p-3 font-mono space-y-1">
                <div>Kategori: <strong className="text-foreground">{category}</strong></div>
                <div>Nama Tempat: <strong className="text-foreground">{placeName}</strong></div>
                <div>Tampilan: <strong className="text-primary">{previewLabel}</strong></div>
                <div>Urutan: <strong className="text-foreground">#{sortOrder}</strong></div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isPending}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeAddLocation}
              className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Menyimpan..." : "Ya, Tambah Lokasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog: Tambah Pengguna Baru */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Buat Akun Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Daftarkan akun petugas terminal atau supervisor regional.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!username.trim() || !fullName.trim() || !password) return;
              setConfirmUserOpen(true);
            }}
            className="space-y-3.5 py-2 text-xs"
          >
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Username Login</Label>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="petugas_bima / spv_jatim"
                className="h-9 rounded-[0.25rem] font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Nama Lengkap</Label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Hendra Wijaya"
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Password Awal</Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Role Hak Akses</Label>
              <SimpleSelect
                value={role}
                onValueChange={(val) => setRole(val as "PETUGAS" | "ADMIN")}
                options={[
                  { value: "PETUGAS", label: "PETUGAS (Input Harian Lokasi Terdaftar)" },
                  { value: "ADMIN", label: "ADMIN / SPV (Akses Pemantauan Seluruh Terminal)" },
                ]}
                className="h-9 rounded-[0.25rem] text-xs"
              />
            </div>

            {role === "PETUGAS" && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-foreground">
                  Pilih Lokasi yang Ditugaskan (Multi-Lokasi)
                </Label>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-[0.25rem] border border-border p-2">
                  {locations.map((loc) => {
                    const checked = selectedLocIds.includes(loc.id);
                    return (
                      <label
                        key={loc.id}
                        className={cn(
                          "flex items-center gap-2 rounded-[0.25rem] p-1.5 cursor-pointer text-xs transition-colors",
                          checked
                            ? "bg-primary/10 font-semibold text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedLocIds((prev) =>
                              toggleLocationIdInSelection(prev, loc.id)
                            )
                          }
                          className="size-3.5 accent-primary"
                        />
                        <span>{loc.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddUserOpen(false)}
                className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
              >
                Lanjut Konfirmasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog: Tambah Pengguna */}
      <AlertDialog open={confirmUserOpen} onOpenChange={setConfirmUserOpen}>
        <AlertDialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-base font-bold text-foreground">
              Konfirmasi Buat Akun Pengguna
            </AlertDialogTitle>
            <div className="space-y-2 pt-1 text-xs text-muted-foreground">
              <p>Apakah Anda yakin ingin membuat akun baru berikut?</p>
              <div className="rounded-[0.25rem] border border-border bg-muted/40 p-3 font-mono space-y-1">
                <div>Username: <strong className="text-foreground">{username}</strong></div>
                <div>Nama: <strong className="text-foreground">{fullName}</strong></div>
                <div>Role: <strong className="text-primary">{role}</strong></div>
                {role === "PETUGAS" && (
                  <div>
                    Lokasi: <strong className="text-foreground">{selectedLocIds.length} lokasi</strong>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isPending}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeAddUser}
              className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Membuat Akun..." : "Ya, Simpan Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Dialog: Atur Penugasan Lokasi Petugas */}
      <Dialog
        open={Boolean(assignUser)}
        onOpenChange={(open) => {
          if (!open) setAssignUser(null);
        }}
      >
        <DialogContent className="rounded-[0.5rem] border border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Atur Penugasan Lokasi: {assignUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih satu atau lebih titik terminal yang menjadi tanggung jawab pelaporan petugas ini.
            </DialogDescription>
          </DialogHeader>

          {assignUser && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-[0.25rem] border border-border bg-muted/40 p-2.5">
                <span className="text-muted-foreground">Akun:</span>{" "}
                <strong className="font-mono text-foreground">{assignUser.username}</strong>
                <span className="ml-2 text-muted-foreground">
                  ({assignLocIds.length} Lokasi Terpilih)
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 rounded-[0.25rem] border border-border p-2">
                {locations.map((loc) => {
                  const checked = assignLocIds.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className={cn(
                        "flex items-center justify-between rounded-[0.25rem] p-2 cursor-pointer transition-colors",
                        checked
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAssignLocIds((prev) =>
                              toggleLocationIdInSelection(prev, loc.id)
                            )
                          }
                          className="size-3.5 accent-primary"
                        />
                        <span>{loc.displayName}</span>
                      </div>
                      <CategoryBadge category={loc.category} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setAssignUser(null)}
              className="cursor-pointer rounded-[0.25rem] text-xs font-heading font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={executeSaveAssignment}
              className="cursor-pointer rounded-[0.25rem] bg-primary text-xs font-heading font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? "Menyimpan..." : "Simpan Penugasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
