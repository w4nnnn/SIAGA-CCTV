import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRangeRecapResult } from "./recap.service";
import { buildActivityMatrix } from "@/lib/view-models";

function formatStatusLabel(status: "ON" | "OFF" | "UNREPORTED"): string {
  if (status === "ON") return "ON";
  if (status === "OFF") return "Ada Kendala / OFF";
  return "Belum Lapor";
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD1D5DB" } },
  left: { style: "thin", color: { argb: "FFD1D5DB" } },
  bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  right: { style: "thin", color: { argb: "FFD1D5DB" } },
};

export async function generateExcelRecapBuffer(
  recapData: DateRangeRecapResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIAGA-CCTV";
  workbook.created = new Date();

  const matrix = buildActivityMatrix(recapData);

  // Map untuk lookup cepat catatan & pelapor harian
  const dailyReportMap = new Map<
    string,
    { notes: string | null; reporterName: string | null }
  >();
  for (const r of recapData.dailyRows) {
    dailyReportMap.set(`${r.locationId}:${r.reportDate}`, {
      notes: r.notes,
      reporterName: r.reporterName,
    });
  }

  // 1. Worksheet Utama: Matriks Pemantauan
  const matrixSheet = workbook.addWorksheet("Matriks Pemantauan", {
    views: [{ state: "frozen", xSplit: 1, ySplit: 5 }],
  });

  // Judul & Periode
  matrixSheet.getCell("A1").value = "REKAPITULASI PEMANTAUAN CCTV SIAGA";
  matrixSheet.getCell("A1").font = {
    name: "Arial",
    size: 14,
    bold: true,
    color: { argb: "FF1E293B" },
  };

  matrixSheet.getCell("A2").value = `Periode: ${recapData.startDate} s/d ${recapData.endDate} (${recapData.totalDays} Hari Kalender)`;
  matrixSheet.getCell("A2").font = {
    name: "Arial",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };

  // Kolom A: Lokasi
  matrixSheet.getColumn(1).width = 26;

  // Header Tingkat 1 & 2: Lokasi Operasional (Merge Baris 4-5)
  matrixSheet.mergeCells(4, 1, 5, 1);
  const locHeader = matrixSheet.getCell(4, 1);
  locHeader.value = "Lokasi Operasional";
  locHeader.alignment = { vertical: "middle", horizontal: "center" };
  locHeader.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF334155" } };
  locHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };
  locHeader.border = thinBorder;
  matrixSheet.getCell(5, 1).border = thinBorder;

  // Header Tanggal & Grup Bulan
  let currentCol = 2;
  for (const group of matrix.monthGroups) {
    const startCol = currentCol;
    const endCol = currentCol + group.dates.length - 1;

    // Merge grup bulan di Baris 4
    if (endCol >= startCol) {
      matrixSheet.mergeCells(4, startCol, 4, endCol);
      const monthCell = matrixSheet.getCell(4, startCol);
      monthCell.value = group.monthLabel;
      monthCell.alignment = { vertical: "middle", horizontal: "center" };
      monthCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1E293B" } };
      monthCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      for (let c = startCol; c <= endCol; c++) {
        matrixSheet.getCell(4, c).border = thinBorder;
      }
    }

    // Baris 5: Nomor Tanggal (01, 02, ...)
    for (const d of group.dates) {
      const dateCell = matrixSheet.getCell(5, currentCol);
      dateCell.value = d.dayLabel;
      dateCell.alignment = { vertical: "middle", horizontal: "center" };
      dateCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
      dateCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
      dateCell.border = thinBorder;
      matrixSheet.getColumn(currentCol).width = 5.5;
      currentCol++;
    }
  }

  // Isi Baris Matriks (Baris 6 dst.)
  matrix.rows.forEach((row, rowIdx) => {
    const excelRow = 6 + rowIdx;

    // Nama Lokasi
    const locCell = matrixSheet.getCell(excelRow, 1);
    locCell.value = row.displayName;
    locCell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF0F172A" } };
    locCell.border = thinBorder;
    locCell.alignment = { vertical: "middle", horizontal: "left" };

    // Sel Tanggal
    matrix.dates.forEach((dateStr, dateIdx) => {
      const col = 2 + dateIdx;
      const cell = matrixSheet.getCell(excelRow, col);
      const status = row.cells[dateStr] ?? "UNREPORTED";
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", horizontal: "center" };

      if (status === "ON") {
        cell.value = "ON";
        cell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: "FF047857" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" },
        };
      } else if (status === "OFF") {
        cell.value = "OFF";
        cell.font = { name: "Arial", size: 8.5, bold: true, color: { argb: "FFB91C1C" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEE2E2" },
        };

        // Note tooltip berisi catatan kendala dan pelapor
        const rep = dailyReportMap.get(`${row.locationId}:${dateStr}`);
        const noteText = [
          `Kendala: ${rep?.notes || "Kendala operasional"}`,
          `Pelapor: ${rep?.reporterName || "Petugas Lapangan"}`,
        ].join("\n");

        cell.note = noteText;
      } else {
        cell.value = "-";
        cell.font = { name: "Arial", size: 8.5, color: { argb: "FF94A3B8" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });
  });

  // 2. Bagian Bawah: Daftar Catatan Kendala Lapangan
  const offIncidents = recapData.dailyRows.filter((r) => r.status === "OFF");
  const noteHeaderRow = 6 + matrix.rows.length + 3;

  matrixSheet.getCell(noteHeaderRow, 1).value =
    "DAFTAR CATATAN KENDALA LAPANGAN (INCIDENT LOG)";
  matrixSheet.getCell(noteHeaderRow, 1).font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: "FFB91C1C" },
  };

  const tableHeadRow = noteHeaderRow + 1;
  const incidentHeaders = [
    { label: "No", width: 6 },
    { label: "Tanggal", width: 14 },
    { label: "Nama Lokasi", width: 26 },
    { label: "Rincian Catatan Kendala", width: 36 },
    { label: "Petugas Pelapor", width: 20 },
  ];

  incidentHeaders.forEach((h, idx) => {
    const c = matrixSheet.getCell(tableHeadRow, idx + 1);
    c.value = h.label;
    c.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE11D48" },
    };
    c.alignment = {
      vertical: "middle",
      horizontal: idx === 0 ? "center" : "left",
    };
    c.border = thinBorder;
  });

  if (offIncidents.length === 0) {
    const emptyRow = tableHeadRow + 1;
    matrixSheet.mergeCells(emptyRow, 1, emptyRow, 5);
    const emptyCell = matrixSheet.getCell(emptyRow, 1);
    emptyCell.value =
      "Nihil kendala operasional pada periode ini (Seluruh kamera beroperasi normal / Zero Downtime).";
    emptyCell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF047857" } };
    emptyCell.alignment = { vertical: "middle", horizontal: "center" };
    emptyCell.border = thinBorder;
  } else {
    offIncidents.forEach((item, idx) => {
      const curR = tableHeadRow + 1 + idx;
      const values = [
        idx + 1,
        item.reportDate,
        item.displayName,
        item.notes || "Ada Kendala Operasional",
        item.reporterName || "Petugas Lapangan",
      ];

      values.forEach((v, cIdx) => {
        const c = matrixSheet.getCell(curR, cIdx + 1);
        c.value = v;
        c.font = { name: "Arial", size: 9, color: { argb: "FF1E293B" } };
        c.border = thinBorder;
        c.alignment = {
          vertical: "middle",
          horizontal: cIdx === 0 ? "center" : "left",
          wrapText: cIdx === 3,
        };
        if (idx % 2 === 1) {
          c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF1F2" },
          };
        }
      });
    });
  }

  // Sheet 2: Detail Harian (Audit Log Lengkap)
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
  const matrix = buildActivityMatrix(recapData);

  // Header Dokumen
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Rekapitulasi Pemantauan CCTV SIAGA", 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Periode: ${recapData.startDate} s/d ${recapData.endDate} (${recapData.totalDays} hari kalender)`,
    14,
    21
  );

  // Tabel 1: Matriks Lokasi x Tanggal
  const headRow = [
    "Lokasi",
    ...matrix.dates.map((d) => d.slice(8, 10)),
  ];

  const matrixBody = matrix.rows.map((row) => [
    row.displayName,
    ...matrix.dates.map((d) => {
      const s = row.cells[d];
      return s === "ON" ? "ON" : s === "OFF" ? "OFF" : "-";
    }),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [headRow],
    body: matrixBody,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 42 },
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index > 0) {
        if (data.cell.raw === "ON") {
          data.cell.styles.fillColor = [209, 250, 229];
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "OFF") {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [156, 163, 175];
        }
      }
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 80;

  // Tabel 2: Daftar Catatan Kendala Lapangan
  const offRows = recapData.dailyRows.filter((r) => r.status === "OFF");

  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text("Daftar Catatan Kendala Lapangan (Incident Log)", 14, finalY + 10);

  const incidentBody =
    offRows.length === 0
      ? [["-", "-", "-", "Operasional prima / nihil kendala", "-"]]
      : offRows.map((r, i) => [
          i + 1,
          r.reportDate,
          r.displayName,
          r.notes ?? "-",
          r.reporterName ?? "-",
        ]);

  autoTable(doc, {
    startY: finalY + 14,
    head: [["No", "Tanggal", "Lokasi", "Catatan Kendala", "Petugas Pelapor"]],
    body: incidentBody,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 24 },
      2: { cellWidth: 45, fontStyle: "bold" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 35 },
    },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
