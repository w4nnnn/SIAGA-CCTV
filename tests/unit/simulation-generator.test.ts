import { describe, it, expect } from "vitest";
import {
  SIMULATION_LOCATIONS,
  SIMULATION_USERS,
  REALISTIC_OFF_NOTES,
  getPast30Days,
  generateSimulationReports,
} from "../../src/db/simulation-generator";

describe("Simulation Generator", () => {
  describe("SIMULATION_LOCATIONS & SIMULATION_USERS configuration", () => {
    it("memiliki tepat 10 lokasi master", () => {
      expect(SIMULATION_LOCATIONS).toHaveLength(10);
      SIMULATION_LOCATIONS.forEach((loc) => {
        expect(loc.category).toBeTruthy();
        expect(loc.name).toBeTruthy();
        expect(typeof loc.sortOrder).toBe("number");
      });
    });

    it("memiliki 1 user ADMIN dan 3 user PETUGAS", () => {
      expect(SIMULATION_USERS).toHaveLength(4);

      const adminUser = SIMULATION_USERS.find((u) => u.role === "ADMIN");
      expect(adminUser).toBeDefined();
      expect(adminUser?.username).toBe("admin");

      const petugasList = SIMULATION_USERS.filter((u) => u.role === "PETUGAS");
      expect(petugasList).toHaveLength(3);
    });

    it("membagi 10 lokasi secara merata dan tanpa tumpang tindih ke 3 petugas", () => {
      const petugasList = SIMULATION_USERS.filter((u) => u.role === "PETUGAS");
      const assignedIndices = petugasList.flatMap((p) => p.assignedLocationIndices);

      expect(assignedIndices).toHaveLength(10);
      // Indeks 0 s.d. 9 seluruhnya terpakai tanpa duplikasi
      const sorted = [...assignedIndices].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Petugas 1 memegang 4 lokasi, Petugas 2 memegang 3 lokasi, Petugas 3 memegang 3 lokasi
      expect(petugasList[0].assignedLocationIndices).toHaveLength(4);
      expect(petugasList[1].assignedLocationIndices).toHaveLength(3);
      expect(petugasList[2].assignedLocationIndices).toHaveLength(3);
    });
  });

  describe("getPast30Days", () => {
    it("menghasilkan tepat 30 tanggal terurut hingga tanggal acuan", () => {
      const refDate = new Date("2026-11-03T10:00:00Z");
      const dates = getPast30Days(refDate);

      expect(dates).toHaveLength(30);
      expect(dates[dates.length - 1]).toBe("2026-11-03");
      expect(dates[0]).toBe("2026-10-05");

      // Format YYYY-MM-DD
      dates.forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe("generateSimulationReports", () => {
    const dates = getPast30Days(new Date("2026-11-03T12:00:00Z"));
    const reports = generateSimulationReports(dates);

    it("menghasilkan tepat 300 data laporan (30 hari x 10 lokasi)", () => {
      expect(reports).toHaveLength(300);
    });

    it("setiap tanggal memiliki 10 laporan lengkap tanpa ada lokasi yang bolong", () => {
      for (const d of dates) {
        const reportsForDate = reports.filter((r) => r.reportDate === d);
        expect(reportsForDate).toHaveLength(10);

        const locationIndices = reportsForDate.map((r) => r.locationIndex).sort((a, b) => a - b);
        expect(locationIndices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      }
    });

    it("memiliki status ON atau OFF; OFF disertai catatan kendala realistis dan ON notes null", () => {
      let offCount = 0;
      let onCount = 0;

      for (const r of reports) {
        expect(["ON", "OFF"]).toContain(r.status);
        if (r.status === "OFF") {
          offCount++;
          expect(r.notes).toBeTruthy();
          expect(REALISTIC_OFF_NOTES).toContain(r.notes);
        } else {
          onCount++;
          expect(r.notes).toBeNull();
        }
      }

      // Proporsi OFF harus berada pada batas realistis (5% - 25%)
      const offPercentage = (offCount / reports.length) * 100;
      expect(offPercentage).toBeGreaterThanOrEqual(5);
      expect(offPercentage).toBeLessThanOrEqual(25);
      expect(onCount + offCount).toBe(300);
    });
  });
});
