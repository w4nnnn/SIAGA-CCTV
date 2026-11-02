import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildDateRangeRecap } from "../../src/server/services/recap.service";
import {
  generateExcelRecapBuffer,
  generatePdfRecapBuffer,
} from "../../src/server/services/export.service";

describe("export.service Excel & PDF generation", () => {
  const locations = [
    { id: "loc-1", category: "IT", name: "Bima", sortOrder: 1 },
    { id: "loc-2", category: "BP", name: "Gresik", sortOrder: 2 },
  ];

  const recap = buildDateRangeRecap(
    { startDate: "2026-11-01", endDate: "2026-11-02" },
    locations,
    [
      {
        locationId: "loc-1",
        reportDate: "2026-11-01",
        status: "ON",
        notes: null,
        reporterName: "Andi",
      },
      {
        locationId: "loc-2",
        reportDate: "2026-11-01",
        status: "OFF",
        notes: "Adaptor rusak",
        reporterName: "Budi",
      },
    ]
  );

  it("menghasilkan buffer file Excel (.xlsx) yang valid dengan sheet Ringkasan dan Detail Harian", async () => {
    const buffer = await generateExcelRecapBuffer(recap);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);
    const summarySheet = workbook.getWorksheet("Ringkasan Lokasi");
    const detailSheet = workbook.getWorksheet("Detail Harian");
    expect(summarySheet).toBeDefined();
    expect(detailSheet).toBeDefined();
    expect(summarySheet?.getCell("D2").value).toBe("IT Bima");
  });

  it("menghasilkan buffer file PDF (%PDF-) yang valid", () => {
    const pdfBuffer = generatePdfRecapBuffer(recap);
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
