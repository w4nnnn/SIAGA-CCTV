import { describe, it, expect } from "vitest";
import { formatLocationDisplayName } from "../../src/lib/format";
import { batchReportInputSchema, locationInputSchema } from "../../src/lib/validators";
import { assertAdmin, assertCanAccessLocations, AuthorizationError } from "../../src/lib/auth";
import { buildLocationRecord } from "../../src/server/services/location.service";

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

describe("Authorization guards & location record builder", () => {
  it("mengizinkan ADMIN mengakses lokasi mana saja", () => {
    expect(() =>
      assertCanAccessLocations(
        { id: "u1", username: "admin", name: "SPV", role: "ADMIN" },
        ["loc-1", "loc-99"],
        []
      )
    ).not.toThrow();
  });

  it("menolak PETUGAS jika menginput lokasi di luar daftar user_locations miliknya", () => {
    expect(() =>
      assertCanAccessLocations(
        { id: "u2", username: "petugas1", name: "Petugas", role: "PETUGAS" },
        ["loc-1", "loc-2"],
        ["loc-1"]
      )
    ).toThrow(AuthorizationError);
  });

  it("menolak non-admin pada assertAdmin", () => {
    expect(() =>
      assertAdmin({ id: "u2", username: "petugas1", name: "Petugas", role: "PETUGAS" })
    ).toThrow(AuthorizationError);
  });

  it("mengizinkan nama lokasi yang sama jika kategorinya berbeda (IT Surabaya vs LPG Surabaya) namun menolak kombinasi identik", () => {
    const existing = [{ id: "1", category: "IT", name: "Surabaya" }];
    const lpgSurabaya = buildLocationRecord({ category: "LPG", name: "Surabaya" }, existing);
    expect(lpgSurabaya.displayName).toBe("LPG Surabaya");

    expect(() =>
      buildLocationRecord({ category: "it", name: "surabaya" }, existing)
    ).toThrow(/sudah terdaftar/i);
  });
});
