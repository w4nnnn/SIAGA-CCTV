"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, UserPlus } from "lucide-react";
import { formatLocationDisplayName } from "@/lib/format";
import { toggleLocationIdInSelection } from "@/lib/ui-state";
import { createLocationAction } from "@/server/actions/location.actions";
import { createUserAction } from "@/server/actions/user.actions";

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

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PETUGAS" | "ADMIN">("PETUGAS");
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [userFeedback, setUserFeedback] = useState<string | null>(null);

  const previewLabel = placeName.trim()
    ? formatLocationDisplayName({ category, name: placeName })
    : `${category} [Nama Tempat]`;

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
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
      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
          <h2 className="font-mono text-lg font-bold text-[var(--color-foreground)]">
            Master Lokasi (Kategori + Nama Tempat)
          </h2>
        </div>

        <form onSubmit={handleAddLocation} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="loc-category"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Kategori
              </label>
              <input
                id="loc-category"
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                placeholder="IT / FT / AFT / LPG / BP"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="loc-name"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Nama Tempat
              </label>
              <input
                id="loc-name"
                type="text"
                required
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Contoh: Bima"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="loc-sort"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Urutan
              </label>
              <input
                id="loc-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--color-muted)] px-3.5 py-2 text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              Pratinjau Tampilan Laporan:
            </span>
            <span className="font-mono font-bold text-[var(--color-foreground)]">
              {previewLabel}
            </span>
          </div>

          {locFeedback && (
            <p className="text-xs font-medium text-[var(--color-accent)]">
              {locFeedback}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)]"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Tambah Lokasi</span>
          </button>
        </form>

        <div className="overflow-x-auto border-t border-[var(--color-border)] pt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                <th className="py-2">Urutan</th>
                <th className="py-2">Kategori</th>
                <th className="py-2">Nama Tempat</th>
                <th className="py-2">Label Tampilan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td className="py-2 font-mono">{loc.sortOrder}</td>
                  <td className="py-2 font-mono">{loc.category}</td>
                  <td className="py-2">{loc.name}</td>
                  <td className="py-2 font-mono font-semibold">
                    {loc.displayName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center gap-2.5">
          <UserPlus className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
          <h2 className="font-mono text-lg font-bold text-[var(--color-foreground)]">
            Master Akun &amp; Penugasan Multi-Lokasi Petugas
          </h2>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="user-username"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Username Login
              </label>
              <input
                id="user-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="petugas_bima"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="user-fullname"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Nama Lengkap
              </label>
              <input
                id="user-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Petugas / SPV"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="user-password"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Password Awal
              </label>
              <input
                id="user-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="user-role"
                className="mb-1 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                Role
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "PETUGAS" | "ADMIN")
                }
                className="min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="PETUGAS">PETUGAS (Input Lokasi)</option>
                <option value="ADMIN">ADMIN / SPV (Semua Akses)</option>
              </select>
            </div>
          </div>

          {role === "PETUGAS" && (
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
                Pilih Lokasi yang Dipegang Petugas (Bisa Lebih dari 1)
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {locations.map((loc) => {
                  const checked = selectedLocIds.includes(loc.id);
                  return (
                    <label
                      key={loc.id}
                      className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors duration-200 ${
                        checked
                          ? "border-[var(--color-accent)] bg-emerald-500/10 font-semibold"
                          : "border-[var(--color-border)] bg-[var(--color-background)]"
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
            <p className="text-xs font-medium text-[var(--color-accent)]">
              {userFeedback}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)]"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Simpan Akun Pengguna</span>
          </button>
        </form>

        <div className="overflow-x-auto border-t border-[var(--color-border)] pt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                <th className="py-2">Username</th>
                <th className="py-2">Nama</th>
                <th className="py-2">Role</th>
                <th className="py-2">Lokasi Ditugaskan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 font-mono font-semibold">{u.username}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 font-mono">{u.role}</td>
                  <td className="py-2 font-mono">
                    {u.role === "ADMIN"
                      ? "Semua Lokasi"
                      : u.assignedLocations.length > 0
                        ? u.assignedLocations
                            .map((l) => l.displayName)
                            .join(", ")
                        : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
