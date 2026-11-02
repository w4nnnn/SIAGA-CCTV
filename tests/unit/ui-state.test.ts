import { describe, it, expect } from "vitest";
import {
  createInitialBatchFormState,
  applySelectAllOn,
  updateRowStatus,
  updateRowNotes,
  buildExportDownloadUrl,
  resolveInitialTheme,
  getNavigationItemsForRole,
  updateHistoryEditDraftStatus,
  toggleLocationIdInSelection,
  getTodayDateInJakarta,
} from "../../src/lib/ui-state";

describe("ui-state helpers for batch form, theme, & export URLs", () => {
  const sampleLocations = [
    {
      locationId: "loc-1",
      displayName: "IT Bima",
      report: null,
    },
    {
      locationId: "loc-2",
      displayName: "BP Gresik",
      report: { status: "OFF" as const, notes: "Off 3 titik" },
    },
  ];

  it("menginisialisasi form batch dengan default ON untuk lokasi yang belum lapor dan mempertahankan data lokasi yang sudah lapor", () => {
    const state = createInitialBatchFormState(sampleLocations);
    expect(state).toEqual([
      {
        locationId: "loc-1",
        displayName: "IT Bima",
        status: "ON",
        notes: "",
        isAlreadyReported: false,
      },
      {
        locationId: "loc-2",
        displayName: "BP Gresik",
        status: "OFF",
        notes: "Off 3 titik",
        isAlreadyReported: true,
      },
    ]);
  });

  it("mengubah semua baris menjadi ON dan mengosongkan notes saat tombol Pilih Semua ON ditekan", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const allOn = applySelectAllOn(initial);
    expect(allOn.every((r) => r.status === "ON" && r.notes === "")).toBe(true);
  });

  it("mengosongkan notes pada baris yang diubah dari OFF ke ON", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const updated = updateRowStatus(initial, "loc-2", "ON");
    expect(updated[1].status).toBe("ON");
    expect(updated[1].notes).toBe("");
  });

  it("memperbarui notes pada baris lokasi yang berstatus OFF", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const updated = updateRowNotes(
      initial,
      "loc-2",
      "Adaptor kamera gerbang diganti"
    );
    expect(updated[1].notes).toBe("Adaptor kamera gerbang diganti");
  });

  it("menyusun URL download Excel dan PDF lengkap dengan query filter", () => {
    expect(
      buildExportDownloadUrl("excel", {
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        locationId: "loc-1",
        status: "OFF",
      })
    ).toBe(
      "/api/export/excel?startDate=2026-11-01&endDate=2026-11-30&locationId=loc-1&status=OFF"
    );
  });

  it("menentukan tema awal (light/dark) dari nilai tersimpan atau preferensi sistem", () => {
    expect(resolveInitialTheme("light", true)).toBe("light");
    expect(resolveInitialTheme("dark", false)).toBe("dark");
    expect(resolveInitialTheme(null, true)).toBe("dark");
    expect(resolveInitialTheme(null, false)).toBe("light");
  });

  it("menyediakan menu navigasi yang sesuai untuk role PETUGAS dan ADMIN", () => {
    const petugasNav = getNavigationItemsForRole("PETUGAS");
    expect(petugasNav.map((n) => n.href)).toEqual(["/petugas", "/petugas/riwayat"]);

    const adminNav = getNavigationItemsForRole("ADMIN");
    expect(adminNav.map((n) => n.href)).toEqual([
      "/admin",
      "/admin/rekap",
      "/admin/master",
      "/petugas",
    ]);
  });

  it("mereset catatan menjadi kosong saat draft edit riwayat diubah dari OFF ke ON", () => {
    const draft = {
      reportId: "rep-1",
      status: "OFF" as const,
      notes: "Kamera gerbang mati",
    };
    const nextDraft = updateHistoryEditDraftStatus(draft, "ON");
    expect(nextDraft.status).toBe("ON");
    expect(nextDraft.notes).toBe("");
  });

  it("menambah atau menghapus locationId pada pilihan multi-lokasi petugas", () => {
    expect(toggleLocationIdInSelection(["loc-1"], "loc-2")).toEqual([
      "loc-1",
      "loc-2",
    ]);
    expect(toggleLocationIdInSelection(["loc-1", "loc-2"], "loc-1")).toEqual([
      "loc-2",
    ]);
  });
});

describe("getTodayDateInJakarta", () => {
  it("memakai tanggal WIB, bukan UTC, saat lewat tengah malam WIB", () => {
    // 2026-11-01 18:30 UTC = 2026-11-02 01:30 WIB
    expect(getTodayDateInJakarta(new Date("2026-11-01T18:30:00Z"))).toBe("2026-11-02");
    // 2026-11-02 16:59 UTC = 2026-11-02 23:59 WIB
    expect(getTodayDateInJakarta(new Date("2026-11-02T16:59:00Z"))).toBe("2026-11-02");
  });
});
