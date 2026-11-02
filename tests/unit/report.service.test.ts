import { describe, it, expect } from "vitest";
import {
  prepareBatchReportRecords,
  prepareUpdatedReportRecord,
} from "../../src/server/services/report.service";
import { AuthorizationError } from "../../src/lib/auth";

describe("report.service batch & edit logic", () => {
  const petugas = {
    id: "user-1",
    username: "petugas_sby",
    name: "Budi",
    role: "PETUGAS" as const,
  };

  it("menyiapkan payload batch upsert untuk beberapa lokasi yang dipegang petugas sekaligus", () => {
    const records = prepareBatchReportRecords(
      petugas,
      ["loc-it-sby", "loc-lpg-sby"],
      {
        reportDate: "2026-11-02",
        items: [
          { locationId: "loc-it-sby", status: "ON", notes: "harus hilang" },
          {
            locationId: "loc-lpg-sby",
            status: "OFF",
            notes: "Off 2 kamera gerbang",
          },
        ],
      }
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      locationId: "loc-it-sby",
      reportDate: "2026-11-02",
      status: "ON",
      notes: null,
      reportedBy: "user-1",
      updatedBy: "user-1",
    });
    expect(records[1]).toMatchObject({
      locationId: "loc-lpg-sby",
      reportDate: "2026-11-02",
      status: "OFF",
      notes: "Off 2 kamera gerbang",
    });
  });

  it("menolak batch submit jika salah satu lokasi bukan tanggung jawab petugas", () => {
    expect(() =>
      prepareBatchReportRecords(petugas, ["loc-it-sby"], {
        reportDate: "2026-11-02",
        items: [{ locationId: "loc-bp-gresik", status: "ON" }],
      })
    ).toThrow(AuthorizationError);
  });

  it("membersihkan notes menjadi null saat riwayat laporan diubah dari OFF menjadi ON", () => {
    const updated = prepareUpdatedReportRecord(
      petugas,
      ["loc-bp-gresik"],
      {
        id: "rep-1",
        locationId: "loc-bp-gresik",
        status: "OFF",
        notes: "Off 3",
      },
      { status: "ON", notes: "Off 3" }
    );
    expect(updated.status).toBe("ON");
    expect(updated.notes).toBeNull();
    expect(updated.updatedBy).toBe("user-1");
  });

  it("menolak edit riwayat laporan jika lokasi laporan bukan milik petugas", () => {
    expect(() =>
      prepareUpdatedReportRecord(
        petugas,
        ["loc-it-sby"],
        {
          id: "rep-1",
          locationId: "loc-bp-gresik",
          status: "OFF",
          notes: "Off 3",
        },
        { status: "ON" }
      )
    ).toThrow(AuthorizationError);
  });
});
