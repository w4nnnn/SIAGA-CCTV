"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, UserPlus } from "lucide-react";
import { formatLocationDisplayName } from "@/lib/format";
import { toggleLocationIdInSelection } from "@/lib/ui-state";
import { createLocationAction } from "@/server/actions/location.actions";
import { createUserAction } from "@/server/actions/user.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LocationRecord {
  id: string;
  category: string;
  name: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "PETUGAS";
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

  const [category, setCategory] = useState("IT");
  const [placeName, setPlaceName] = useState("");
  const [sortOrder, setSortOrder] = useState(locations.length + 1);
  const [locFeedback, setLocFeedback] = useState<string | null>(null);
  const [confirmLocOpen, setConfirmLocOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PETUGAS" | "ADMIN">("PETUGAS");
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);

  const previewLabel = placeName.trim()
    ? formatLocationDisplayName({ category, name: placeName })
    : `${category} [Nama Tempat]`;

  const handleOpenAddLocationConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !placeName.trim()) return;
    setConfirmLocOpen(true);
  };

  const executeAddLocation = () => {
    setConfirmLocOpen(false);
    setLocFeedback(null);

    startTransition(async () => {
      try {
        await createLocationAction({
          category,
          name: placeName,
          sortOrder: Number(sortOrder) || 0,
        });
        setPlaceName("");
        setSortOrder((prev) => prev + 1);
        setLocFeedback("Lokasi baru berhasil ditambahkan.");
        router.refresh();
      } catch (err) {
        setLocFeedback(
          err instanceof Error ? err.message : "Gagal menambah lokasi."
        );
      }
    });
  };

  const handleOpenAddUserConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !password) return;
    setConfirmUserOpen(true);
  };

  const executeAddUser = () => {
    setConfirmUserOpen(false);
    setUserFeedback(null);

    startTransition(async () => {
      try {
        await createUserAction({
          username,
          name: fullName,
          password,
          role,
          locationIds: role === "PETUGAS" ? selectedLocIds : [],
        });
        setUsername("");
        setFullName("");
        setPassword("");
        setSelectedLocIds([]);
        setUserFeedback("Akun pengguna berhasil dibuat.");
        router.refresh();
      } catch (err) {
        setUserFeedback(
          err instanceof Error ? err.message : "Gagal membuat akun pengguna."
        );
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <CardTitle className="font-mono text-lg font-bold">
              Master Lokasi (Kategori + Nama Tempat)
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleOpenAddLocationConfirm} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="loc-category" className="text-xs uppercase text-muted-foreground">
                  Kategori
                </Label>
                <Input
                  id="loc-category"
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value.toUpperCase())}
                  placeholder="IT / FT / AFT"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="loc-name" className="text-xs uppercase text-muted-foreground">
                  Nama Tempat
                </Label>
                <Input
                  id="loc-name"
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="Contoh: Bima"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="loc-sort" className="text-xs uppercase text-muted-foreground">
                  Urutan
                </Label>
                <Input
                  id="loc-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted px-3.5 py-2 text-xs">
              <span className="text-muted-foreground">
                Pratinjau Tampilan Laporan:
              </span>
              <span className="font-mono font-bold text-foreground">
                {previewLabel}
              </span>
            </div>

            {locFeedback && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {locFeedback}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Lokasi</span>
            </Button>
          </form>

          <div className="border-t border-border pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2">Urutan</TableHead>
                  <TableHead className="py-2">Kategori</TableHead>
                  <TableHead className="py-2">Nama Tempat</TableHead>
                  <TableHead className="py-2">Label Tampilan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.id}>
                    <TableCell className="py-2 font-mono">{loc.sortOrder}</TableCell>
                    <TableCell className="py-2 font-mono">{loc.category}</TableCell>
                    <TableCell className="py-2">{loc.name}</TableCell>
                    <TableCell className="py-2 font-mono font-semibold">
                      {loc.displayName}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <CardTitle className="font-mono text-lg font-bold">
              Master Akun &amp; Penugasan Multi-Lokasi
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleOpenAddUserConfirm} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="user-username" className="text-xs uppercase text-muted-foreground">
                  Username Login
                </Label>
                <Input
                  id="user-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="petugas_bima"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-fullname" className="text-xs uppercase text-muted-foreground">
                  Nama Lengkap
                </Label>
                <Input
                  id="user-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Petugas / SPV"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-password" className="text-xs uppercase text-muted-foreground">
                  Password Awal
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="user-role" className="text-xs uppercase text-muted-foreground">
                  Role
                </Label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "PETUGAS" | "ADMIN")
                  }
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="PETUGAS" className="bg-popover text-popover-foreground">
                    PETUGAS (Input Lokasi)
                  </option>
                  <option value="ADMIN" className="bg-popover text-popover-foreground">
                    ADMIN / SPV (Semua Akses)
                  </option>
                </select>
              </div>
            </div>

            {role === "PETUGAS" && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">
                  Pilih Lokasi yang Dipegang Petugas (Bisa Lebih dari 1)
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {locations.map((loc) => {
                    const checked = selectedLocIds.includes(loc.id);
                    return (
                      <label
                        key={loc.id}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-colors duration-200 ${
                          checked
                            ? "border-emerald-500 bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                            : "border-border bg-card"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedLocIds((prev) =>
                              toggleLocationIdInSelection(prev, loc.id)
                            )
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <span className="font-mono">{loc.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {userFeedback && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {userFeedback}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Simpan Akun Pengguna</span>
            </Button>
          </form>

          <div className="border-t border-border pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2">Username</TableHead>
                  <TableHead className="py-2">Nama</TableHead>
                  <TableHead className="py-2">Role</TableHead>
                  <TableHead className="py-2">Lokasi Ditugaskan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="py-2 font-mono font-semibold">{u.username}</TableCell>
                    <TableCell className="py-2">{u.name}</TableCell>
                    <TableCell className="py-2">
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                      {u.role === "ADMIN"
                        ? "Semua Lokasi"
                        : u.assignedLocations.length > 0
                          ? u.assignedLocations
                              .map((l) => l.displayName)
                              .join(", ")
                          : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmLocOpen} onOpenChange={setConfirmLocOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-lg font-bold">
              Konfirmasi Tambah Lokasi
            </AlertDialogTitle>
            <div className="space-y-2 text-sm text-muted-foreground pt-1">
              <p>Apakah Anda yakin ingin menambahkan data lokasi baru berikut?</p>
              <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs space-y-1">
                <div>Kategori: <strong>{category}</strong></div>
                <div>Nama Tempat: <strong>{placeName}</strong></div>
                <div>Tampilan Laporan: <strong className="text-emerald-600 dark:text-emerald-400">{previewLabel}</strong></div>
                <div>Urutan: <strong>{sortOrder}</strong></div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeAddLocation}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {isPending ? "Menyimpan..." : "Ya, Tambah Lokasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmUserOpen} onOpenChange={setConfirmUserOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-lg font-bold">
              Konfirmasi Buat Akun Pengguna
            </AlertDialogTitle>
            <div className="space-y-2 text-sm text-muted-foreground pt-1">
              <p>Apakah Anda yakin ingin membuat akun baru berikut?</p>
              <div className="rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs space-y-1">
                <div>Username: <strong>{username}</strong></div>
                <div>Nama Lengkap: <strong>{fullName}</strong></div>
                <div>Role: <strong>{role}</strong></div>
                {role === "PETUGAS" && (
                  <div>Lokasi Ditugaskan: <strong>{selectedLocIds.length} lokasi</strong></div>
                )}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={executeAddUser}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              {isPending ? "Membuat Akun..." : "Ya, Simpan Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
