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

  it("menghasilkan buffer file Excel (.xlsx) dengan sheet Matriks Pemantauan beku (freeze column), note kendala, dan rekap detail", async () => {
    const buffer = await generateExcelRecapBuffer(recap);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);

    const matrixSheet = workbook.getWorksheet("Matriks Pemantauan");
    expect(matrixSheet).toBeDefined();
    expect(workbook.worksheets[0].name).toBe("Matriks Pemantauan");

    // Freeze pane aktif
    const views = matrixSheet?.views ?? [];
    expect(views.length).toBeGreaterThan(0);
    const frozenView = views[0] as ExcelJS.WorksheetViewFrozen;
    expect(frozenView.xSplit).toBe(1);

    // Sel OFF memiliki note catatan kendala
    // Lokasi baris IT Bima (baris 6), BP Gresik (baris 7). Kolom A = Lokasi, Kolom B = 01, Kolom C = 02.
    const cellOff = matrixSheet?.getCell("B7");
    expect(cellOff?.value).toBe("OFF");
    expect(cellOff?.note).toBeDefined();

    // Sheet detail log tetap tersedia
    const detailSheet = workbook.getWorksheet("Detail Harian");
    expect(detailSheet).toBeDefined();
  });

  it("menghasilkan buffer file PDF (%PDF-) yang valid", () => {
    const pdfBuffer = generatePdfRecapBuffer(recap);
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
