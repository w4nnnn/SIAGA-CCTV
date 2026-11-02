import { describe, it, expect } from "vitest";
import { formatLocationDisplayName } from "../../src/lib/format";
import { batchReportInputSchema, locationInputSchema } from "../../src/lib/validators";

describe("formatLocationDisplayName", () => {
  it("menggabungkan category dan name menjadi satu label tampilan", () => {
    expect(formatLocationDisplayName({ category: "IT", name: "Bima" })).toBe("IT Bima");
    expect(formatLocationDisplayName({ category: "IT", name: "Surabaya" })).toBe("IT Surabaya");
    expect(formatLocationDisplayName({ category: "LPG", name: "Surabaya" })).toBe("LPG Surabaya");
  });
});

describe("batchReportInputSchema", () => {
  it("menerima batch laporan dengan status ON dan OFF beserta catatan opsional", () => {
    const parsed = batchReportInputSchema.parse({
      reportDate: "2026-11-02",
      items: [
        { locationId: "loc-1", status: "ON", notes: "Catatan lama yang harus diabaikan" },
        { locationId: "loc-2", status: "OFF" },
        { locationId: "loc-3", status: "OFF", notes: "Off 3 titik" },
      ],
    });
    expect(parsed.items[0].notes).toBeNull();
    expect(parsed.items[1].notes).toBeNull();
    expect(parsed.items[2].notes).toBe("Off 3 titik");
  });

  it("menolak locationInputSchema jika category atau name kosong", () => {
    expect(() => locationInputSchema.parse({ category: "", name: "Bima" })).toThrow();
  });
});
