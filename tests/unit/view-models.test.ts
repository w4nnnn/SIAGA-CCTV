import { describe, it, expect } from "vitest";
import {
  buildActivityMatrix,
  buildAuditRows,
  buildOperatorHistoryMatrix,
  computeDistribution,
  computeRecapKpis,
  enumerateDateRange,
  filterDashboardItems,
  getLastDayOfMonth,
  getRangePreset,
  groupDatesByMonth,
  detectActivePreset,
  paginate,
  percentOf,
  shiftDate,
} from "../../src/lib/view-models";
import { formatIndonesianMonthYear } from "../../src/lib/format";
import { applySelectAllOff, getNavigationItemsForRole } from "../../src/lib/ui-state";

const recap = {
  startDate: "2026-11-01",
  endDate: "2026-11-03",
  totalDays: 3,
  locationSummaries: [
    { locationId: "a", category: "IT", name: "Bima", displayName: "IT Bima", sortOrder: 1, onDays: 3, offDays: 0, unreportedDays: 0 },
    { locationId: "b", category: "FT", name: "Tuban", displayName: "FT Tuban", sortOrder: 2, onDays: 1, offDays: 1, unreportedDays: 1 },
  ],
  dailyRows: [
    { reportDate: "2026-11-01", locationId: "a", category: "IT", name: "Bima", displayName: "IT Bima", status: "ON" as const, notes: null, reporterName: null },
    { reportDate: "2026-11-01", locationId: "b", category: "FT", name: "Tuban", displayName: "FT Tuban", status: "ON" as const, notes: null, reporterName: null },
    { reportDate: "2026-11-02", locationId: "a", category: "IT", name: "Bima", displayName: "IT Bima", status: "ON" as const, notes: null, reporterName: null },
    { reportDate: "2026-11-02", locationId: "b", category: "FT", name: "Tuban", displayName: "FT Tuban", status: "OFF" as const, notes: "Switch mati", reporterName: null },
    { reportDate: "2026-11-03", locationId: "a", category: "IT", name: "Bima", displayName: "IT Bima", status: "ON" as const, notes: null, reporterName: null },
    { reportDate: "2026-11-03", locationId: "b", category: "FT", name: "Tuban", displayName: "FT Tuban", status: "UNREPORTED" as const, notes: null, reporterName: null },
  ],
};

describe("view-models: angka dan persentase", () => {
  it("percentOf membulatkan 1 desimal dan aman untuk pembagi 0", () => {
    expect(percentOf(1, 3)).toBe(33.3);
    expect(percentOf(3, 3)).toBe(100);
    expect(percentOf(0, 0)).toBe(0);
  });

  it("computeDistribution menghitung persentase ON/OFF/Belum dan persen operasional", () => {
    const d = computeDistribution({ totalLocations: 10, onCount: 7, offCount: 2, unreportedCount: 1 });
    expect(d).toEqual({ onPct: 70, offPct: 20, unreportedPct: 10, operationalPct: 70 });
    expect(computeDistribution({ totalLocations: 0, onCount: 0, offCount: 0, unreportedCount: 0 }).operationalPct).toBe(0);
  });
});

describe("view-models: KPI, matriks, dan baris audit rekap", () => {
  it("computeRecapKpis: kepatuhan, hari bebas kendala, insiden", () => {
    const k = computeRecapKpis(recap);
    expect(k.scheduledCount).toBe(6);
    expect(k.reportedCount).toBe(5);
    expect(k.compliancePct).toBe(83.3);
    expect(k.offFreeDays).toBe(1);
    expect(k.incidentCount).toBe(1);
    expect(k.totalDays).toBe(3);
  });

  it("buildActivityMatrix: tanggal berurutan, grup bulan, dan status per sel", () => {
    const m = buildActivityMatrix(recap);
    expect(m.dates).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(m.monthGroups).toEqual([
      {
        monthKey: "2026-11",
        monthLabel: "November 2026",
        dates: [
          { dateStr: "2026-11-01", dayLabel: "01" },
          { dateStr: "2026-11-02", dayLabel: "02" },
          { dateStr: "2026-11-03", dayLabel: "03" },
        ],
      },
    ]);
    expect(m.rows[1].displayName).toBe("FT Tuban");
    expect(m.rows[1].cells["2026-11-02"]).toBe("OFF");
    expect(m.rows[1].cells["2026-11-03"]).toBe("UNREPORTED");
    expect(m.rows[0].activePct).toBe(100);
    expect(m.rows[1].activePct).toBe(33.3);
  });

  it("enumerateDateRange & groupDatesByMonth: mengelompokkan tanggal lintas bulan dengan label 2 digit", () => {
    expect(formatIndonesianMonthYear("2026-11")).toBe("November 2026");
    expect(formatIndonesianMonthYear("2026-01-15")).toBe("Januari 2026");
    expect(enumerateDateRange("2026-11-05", "2026-11-01")).toEqual([]);

    const dates = enumerateDateRange("2026-10-30", "2026-11-02");
    expect(dates).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);

    const groups = groupDatesByMonth(dates);
    expect(groups).toEqual([
      {
        monthKey: "2026-10",
        monthLabel: "Oktober 2026",
        dates: [
          { dateStr: "2026-10-30", dayLabel: "30" },
          { dateStr: "2026-10-31", dayLabel: "31" },
        ],
      },
      {
        monthKey: "2026-11",
        monthLabel: "November 2026",
        dates: [
          { dateStr: "2026-11-01", dayLabel: "01" },
          { dateStr: "2026-11-02", dayLabel: "02" },
        ],
      },
    ]);
  });

  it("buildOperatorHistoryMatrix: membangun matriks lokasi x tanggal beserta detail laporan dan filter status", () => {
    const locations = [
      { id: "loc-1", category: "IT", name: "Bima", displayName: "IT Bima" },
      { id: "loc-2", category: "FT", name: "Tuban", displayName: "FT Tuban" },
    ];
    const reports = [
      {
        id: "rep-1",
        locationId: "loc-1",
        reportDate: "2026-11-01",
        displayName: "IT Bima",
        category: "IT",
        name: "Bima",
        status: "ON" as const,
        notes: null,
        reporterName: "Budi",
        updatedAt: new Date("2026-11-01T08:00:00Z"),
      },
      {
        id: "rep-2",
        locationId: "loc-2",
        reportDate: "2026-11-02",
        displayName: "FT Tuban",
        category: "FT",
        name: "Tuban",
        status: "OFF" as const,
        notes: "Kamera mati 1",
        reporterName: "Andi",
        updatedAt: new Date("2026-11-02T09:00:00Z"),
      },
    ];

    const matrixAll = buildOperatorHistoryMatrix({
      locations,
      reports,
      startDate: "2026-11-01",
      endDate: "2026-11-02",
    });

    expect(matrixAll.dates).toEqual(["2026-11-01", "2026-11-02"]);
    expect(matrixAll.rows).toHaveLength(2);
    expect(matrixAll.rows[0].cells["2026-11-01"]).toMatchObject({
      reportId: "rep-1",
      status: "ON",
      reporterName: "Budi",
    });
    expect(matrixAll.rows[0].cells["2026-11-02"]).toMatchObject({
      reportId: null,
      status: "UNREPORTED",
    });
    expect(matrixAll.rows[1].cells["2026-11-02"]).toMatchObject({
      reportId: "rep-2",
      status: "OFF",
      notes: "Kamera mati 1",
    });

    // Filter hanya lokasi yang punya status OFF pada rentang tersebut
    const matrixOffOnly = buildOperatorHistoryMatrix({
      locations,
      reports,
      startDate: "2026-11-01",
      endDate: "2026-11-02",
      statusFilter: "OFF",
    });
    expect(matrixOffOnly.rows).toHaveLength(1);
    expect(matrixOffOnly.rows[0].locationId).toBe("loc-2");
  });

  it("buildAuditRows: nomor, keaktifan, dan catatan OFF terbaru", () => {
    const rows = buildAuditRows(recap);
    expect(rows[0]).toMatchObject({ no: 1, displayName: "IT Bima", onDays: 3, activePct: 100, latestNote: null });
    expect(rows[1]).toMatchObject({ no: 2, offDays: 1, latestNote: "[2026-11-02] Switch mati" });
  });

  it("menangani rekap kosong tanpa error", () => {
    const empty = { ...recap, locationSummaries: [], dailyRows: [] };
    expect(computeRecapKpis(empty).compliancePct).toBe(0);
    expect(buildActivityMatrix(empty).rows).toEqual([]);
  });
});

describe("view-models: tanggal, filter, pagination", () => {
  it("shiftDate menggeser hari lintas bulan", () => {
    expect(shiftDate("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("getLastDayOfMonth menghitung hari terakhir bulan dengan benar", () => {
    expect(getLastDayOfMonth("2026-11-04")).toBe("2026-11-30");
    expect(getLastDayOfMonth("2026-10-15")).toBe("2026-10-31");
    expect(getLastDayOfMonth("2024-02-10")).toBe("2024-02-29"); // kabisat
    expect(getLastDayOfMonth("2025-02-10")).toBe("2025-02-28"); // non-kabisat
  });

  it("getRangePreset: hari ini, 7 hari terakhir, 30 hari terakhir, bulan ini kalender penuh", () => {
    expect(getRangePreset("today", "2026-11-03")).toEqual({ startDate: "2026-11-03", endDate: "2026-11-03" });
    expect(getRangePreset("7d", "2026-11-03")).toEqual({ startDate: "2026-10-28", endDate: "2026-11-03" });
    expect(getRangePreset("30d", "2026-11-03")).toEqual({ startDate: "2026-10-05", endDate: "2026-11-03" });
    expect(getRangePreset("month", "2026-11-03")).toEqual({ startDate: "2026-11-01", endDate: "2026-11-30" });
    // backward compatibility untuk week
    expect(getRangePreset("week", "2026-11-04")).toEqual({ startDate: "2026-11-02", endDate: "2026-11-04" });
  });

  it("detectActivePreset mendeteksi preset aktif secara tepat", () => {
    const today = "2026-11-03";
    expect(detectActivePreset("2026-11-03", "2026-11-03", today)).toBe("today");
    expect(detectActivePreset("2026-10-28", "2026-11-03", today)).toBe("7d");
    expect(detectActivePreset("2026-10-05", "2026-11-03", today)).toBe("30d");
    expect(detectActivePreset("2026-11-01", "2026-11-30", today)).toBe("month");
    expect(detectActivePreset("2026-10-10", "2026-10-20", today)).toBe("custom");
  });

  it("filterDashboardItems memfilter kategori dan kata kunci (case-insensitive)", () => {
    const items = [
      { locationId: "1", category: "IT", displayName: "IT Bima", notes: null },
      { locationId: "2", category: "FT", displayName: "FT Tuban", notes: "Switch mati" },
    ];
    expect(filterDashboardItems(items, "ALL", "")).toHaveLength(2);
    expect(filterDashboardItems(items, "FT", "")).toHaveLength(1);
    expect(filterDashboardItems(items, "ALL", "switch")).toHaveLength(1);
    expect(filterDashboardItems(items, "IT", "tuban")).toHaveLength(0);
  });

  it("paginate membatasi halaman ke rentang valid", () => {
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(paginate(items, 1, 5)).toMatchObject({ items: [1, 2, 3, 4, 5], page: 1, totalPages: 3 });
    expect(paginate(items, 99, 5)).toMatchObject({ items: [11, 12], page: 3 });
    expect(paginate([], 1, 5)).toMatchObject({ items: [], page: 1, totalPages: 1 });
  });
});

describe("ui-state: navigasi dan tandai semua OFF", () => {
  it("menu PETUGAS dan ADMIN sesuai desain baru", () => {
    expect(getNavigationItemsForRole("PETUGAS").map((n) => n.href)).toEqual([
      "/petugas",
      "/petugas/riwayat",
      "/admin/rekap",
    ]);
    expect(getNavigationItemsForRole("ADMIN").map((n) => n.href)).toEqual([
      "/admin",
      "/petugas",
      "/petugas/riwayat",
      "/admin/rekap",
      "/admin/master",
    ]);
  });

  it("applySelectAllOff mengubah semua baris menjadi OFF tanpa menghapus catatan", () => {
    const rows = [
      { locationId: "1", displayName: "A", status: "ON" as const, notes: "", isAlreadyReported: false },
      { locationId: "2", displayName: "B", status: "OFF" as const, notes: "mati", isAlreadyReported: true },
    ];
    const next = applySelectAllOff(rows);
    expect(next.every((r) => r.status === "OFF")).toBe(true);
    expect(next[1].notes).toBe("mati");
  });
});
