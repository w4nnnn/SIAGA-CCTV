import { z } from "zod";

export const locationInputSchema = z.object({
  category: z.string().trim().min(1, "Kategori lokasi wajib diisi"),
  name: z.string().trim().min(1, "Nama tempat lokasi wajib diisi"),
  sortOrder: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const userInputSchema = z.object({
  username: z.string().trim().min(3, "Username minimal 3 karakter"),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "PETUGAS"]),
  locationIds: z.array(z.string().min(1)).default([]),
});

export const reportItemInputSchema = z
  .object({
    locationId: z.string().trim().min(1, "Location ID wajib diisi"),
    status: z.enum(["ON", "OFF"]),
    notes: z.string().trim().nullable().optional(),
  })
  .transform((item) => ({
    locationId: item.locationId,
    status: item.status,
    notes:
      item.status === "ON"
        ? null
        : item.notes && item.notes.length > 0
          ? item.notes
          : null,
  }));

export const batchReportInputSchema = z.object({
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  items: z
    .array(reportItemInputSchema)
    .min(1, "Minimal 1 laporan lokasi harus diisi"),
});

export const updateReportInputSchema = z
  .object({
    status: z.enum(["ON", "OFF"]),
    notes: z.string().trim().nullable().optional(),
  })
  .transform((data) => ({
    status: data.status,
    notes:
      data.status === "ON"
        ? null
        : data.notes && data.notes.length > 0
          ? data.notes
          : null,
  }));

export const recapFilterSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format startDate harus YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format endDate harus YYYY-MM-DD"),
  locationId: z.string().optional(),
  status: z.enum(["ALL", "ON", "OFF", "UNREPORTED"]).optional().default("ALL"),
});
