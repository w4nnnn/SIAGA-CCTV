import { describe, it, expect } from "vitest";
import {
  buildDailyMonitoringRecap,
  buildDateRangeRecap,
  formatWhatsAppDailyReport,
} from "../../src/server/services/recap.service";

describe("recap.service daily monitoring & WhatsApp formatter", () => {
  const locations = [
    { id: "1", category: "AFT", name: "Juanda", sortOrder: 1 },
    { id: "2", category: "IT", name: "Surabaya", sortOrder: 2 },
    { id: "3", category: "IT", name: "Bima", sortOrder: 3 },
    { id: "4", category: "BP", name: "Gresik", sortOrder: 4 },
    { id: "5", category: "FT", name: "Malang", sortOrder: 5 },
  ];

  it("menghitung jumlah ON, OFF, dan Belum Lapor serta menyusun format WhatsApp dengan benar", () => {
    const summary = buildDailyMonitoringRecap("2026-11-02", locations, [
      { locationId: "1", status: "ON", notes: null },
      { locationId: "2", status: "ON", notes: null },
      { locationId: "3", status: "ON", notes: null },
      { locationId: "4", status: "OFF", notes: "Off 3." },
    ]);

    expect(summary.counts).toEqual({
      totalLocations: 5,
      onCount: 3,
      offCount: 1,
      unreportedCount: 1,
    });

    const waText = formatWhatsAppDailyReport(summary);
    expect(waText).toContain("Laporan Harian CCTV");
    expect(waText).toContain("Senin, 02 November 2026");
    expect(waText).toContain("AFT Juanda : On semua.");
    expect(waText).toContain("IT Bima : On semua.");
    expect(waText).toContain("BP Gresik : Off 3.");
    expect(waText).toContain("FT Malang : Belum Lapor.");
  });

  it("menyusun rekap rentang tanggal termasuk lokasi yang belum melapor", () => {
    const rangeRecap = buildDateRangeRecap(
      { startDate: "2026-11-01", endDate: "2026-11-02" },
      locations.slice(0, 2),
      [
        {
          locationId: "1",
          reportDate: "2026-11-01",
          status: "ON",
          notes: null,
          reporterName: "Andi",
        },
        {
          locationId: "2",
          reportDate: "2026-11-01",
          status: "OFF",
          notes: "Off 2",
          reporterName: "Budi",
        },
      ]
    );

    expect(rangeRecap.totalDays).toBe(2);
    expect(rangeRecap.locationSummaries).toHaveLength(2);
    expect(rangeRecap.locationSummaries[0]).toMatchObject({
      displayName: "AFT Juanda",
      onDays: 1,
      offDays: 0,
      unreportedDays: 1,
    });
    expect(rangeRecap.dailyRows).toHaveLength(4);
  });
});
