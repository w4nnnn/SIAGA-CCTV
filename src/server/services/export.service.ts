import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRangeRecapResult } from "./recap.service";

function formatStatusLabel(status: "ON" | "OFF" | "UNREPORTED"): string {
  if (status === "ON") return "ON";
  if (status === "OFF") return "Ada Kendala / OFF";
  return "Belum Lapor";
}

export async function generateExcelRecapBuffer(
  recapData: DateRangeRecapResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIAGA-CCTV";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan Lokasi");
  summarySheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Kategori", key: "category", width: 12 },
    { header: "Nama Lokasi", key: "name", width: 20 },
    { header: "Lokasi (Tampilan)", key: "displayName", width: 24 },
    { header: "Hari ON", key: "onDays", width: 14 },
    { header: "Hari OFF / Kendala", key: "offDays", width: 20 },
    { header: "Hari Belum Lapor", key: "unreportedDays", width: 18 },
  ];

  summarySheet.getRow(1).font = { bold: true };

  recapData.locationSummaries.forEach((loc, idx) => {
    summarySheet.addRow({
      no: idx + 1,
      category: loc.category,
      name: loc.name,
      displayName: loc.displayName,
      onDays: loc.onDays,
      offDays: loc.offDays,
      unreportedDays: loc.unreportedDays,
    });
  });

  const detailSheet = workbook.addWorksheet("Detail Harian");
  detailSheet.columns = [
    { header: "Tanggal", key: "reportDate", width: 15 },
    { header: "Lokasi", key: "displayName", width: 24 },
    { header: "Status", key: "statusLabel", width: 20 },
    { header: "Catatan Kendala", key: "notes", width: 36 },
    { header: "Petugas Pelapor", key: "reporterName", width: 22 },
  ];

  detailSheet.getRow(1).font = { bold: true };

  recapData.dailyRows.forEach((row) => {
    const addedRow = detailSheet.addRow({
      reportDate: row.reportDate,
      displayName: row.displayName,
      statusLabel: formatStatusLabel(row.status),
      notes: row.notes ?? "-",
      reporterName: row.reporterName ?? "-",
    });

    const statusCell = addedRow.getCell(3);
    if (row.status === "ON") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD1FAE5" },
      };
    } else if (row.status === "OFF") {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEE2E2" },
      };
    } else {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };
    }
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function generatePdfRecapBuffer(
  recapData: DateRangeRecapResult
): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Rekapitulasi Laporan Harian SIAGA-CCTV", 14, 15);
  doc.setFontSize(10);
  doc.text(
    `Periode: ${recapData.startDate} s/d ${recapData.endDate} (${recapData.totalDays} hari)`,
    14,
    22
  );

  autoTable(doc, {
    startY: 27,
    head: [
      [
        "No",
        "Lokasi",
        "Hari ON",
        "Hari OFF / Kendala",
        "Hari Belum Lapor",
      ],
    ],
    body: recapData.locationSummaries.map((loc, idx) => [
      idx + 1,
      loc.displayName,
      loc.onDays,
      loc.offDays,
      loc.unreportedDays,
    ]),
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 60;

  autoTable(doc, {
    startY: finalY + 10,
    head: [
      ["Tanggal", "Lokasi", "Status", "Catatan Kendala", "Petugas Pelapor"],
    ],
    body: recapData.dailyRows.map((row) => [
      row.reportDate,
      row.displayName,
      formatStatusLabel(row.status),
      row.notes ?? "-",
      row.reporterName ?? "-",
    ]),
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
