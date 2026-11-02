# SIAGA-CCTV Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun seluruh lapisan backend SIAGA-CCTV (skema database PostgreSQL dengan Drizzle ORM, seeder data awal, autentikasi NextAuth, manajemen master lokasi & petugas multi-lokasi, input batch laporan harian & edit riwayat, serta rekapitulasi admin + export WhatsApp/Excel/PDF).

**Architecture:** Aplikasi fullstack monolith Next.js (App Router) dengan TypeScript. Logika bisnis dipisahkan ke dalam modul service murni di `src/server/services/` yang divalidasi dengan `zod` dan diuji secara otomatis menggunakan `vitest`, kemudian diekspos melalui Next.js Server Actions (`src/server/actions/`) dan API Route Handlers (`src/app/api/`) untuk unduhan file biner (Excel/PDF).

**Tech Stack:** Next.js (App Router), TypeScript, PostgreSQL (`pg`), Drizzle ORM (`drizzle-orm`, `drizzle-kit`), NextAuth.js (`next-auth`, `bcryptjs`), Zod (`zod`), ExcelJS (`exceljs`), jsPDF (`jspdf`, `jspdf-autotable`), Vitest (`vitest`).

**Spec:** `/home/w4nn/workbench/SIAGA-CCTV/KONSEP-SIAGA-CCTV.md`

## Global Constraints

- Framework menggunakan Next.js App Router dengan TypeScript (`strict: true`).
- Database menggunakan PostgreSQL dan ORM menggunakan Drizzle ORM (`drizzle-orm/node-postgres`).
- Tabel `locations` menyimpan `category` (contoh: `"IT"`, `"FT"`, `"AFT"`, `"LPG"`, `"BP"`) dan `name` (hanya nama tempat, contoh: `"Bima"`, `"Surabaya"`, `"Juanda"`) secara terpisah dengan constraint `UNIQUE(category, name)`.
- Format tampilan lokasi di seluruh output backend dan export adalah `${category} ${name}` (contoh: `"IT Bima"`, `"IT Surabaya"`, `"LPG Surabaya"`).
- Tabel `daily_reports` hanya memiliki pilihan status `'ON'` atau `'OFF'` dan kolom `notes` bersifat opsional (nullable), tanpa kolom jumlah CCTV OFF.
- Satu petugas (`ROLE: 'PETUGAS'`) dapat memegang beberapa lokasi melalui tabel penghubung `user_locations` dengan constraint `UNIQUE(user_id, location_id)`.
- Pengisian laporan harian mendukung input sekaligus (*batch upsert*) untuk beberapa lokasi yang dipegang petugas dalam satu kali submit, dengan constraint `UNIQUE(location_id, report_date)`.

## Review Focus

- Petugas mencoba mengirim atau mengedit laporan untuk `location_id` yang tidak ditugaskan kepadanya di `user_locations` -> harus ditolak dengan `AuthorizationError` kecuali role user adalah `'ADMIN'`.
- Input lokasi baru dengan `name` yang sama tetapi `category` berbeda (contoh: `category: "IT", name: "Surabaya"` dan `category: "LPG", name: "Surabaya"`) -> harus berhasil disimpan keduanya; duplikasi hanya ditolak jika kombinasi `(category, name)` sama persis.
- Saat petugas mengubah status laporan dari `'OFF'` (yang sebelumnya memiliki `notes: "Kamera dermaga mati"`) menjadi `'ON'` melalui batch submit atau edit riwayat -> kolom `notes` harus otomatis dibersihkan menjadi `null` agar rekap tidak menampilkan catatan kendala lama pada lokasi yang sudah `'ON'`.
- Batch submit laporan harian pada tanggal yang sama ketika sebagian lokasi sudah pernah dilaporkan sebelumnya -> harus melakukan *upsert* (memperbarui `status`, `notes`, `updated_by`, `updated_at` tanpa mengubah `reported_by` awal) dan tidak boleh gagal karena duplicate key.
- Export WhatsApp, Excel, dan PDF ketika ada lokasi aktif yang belum melapor pada tanggal yang dipilih -> harus tetap menampilkan lokasi tersebut di urutan `sort_order`-nya dengan keterangan status `"Belum Lapor"`, bukan menghilangkannya dari daftar.

---

## File Structure (Backend)

```text
src/
├── db/
│   ├── index.ts                  # Koneksi PostgreSQL Pool & instance Drizzle ORM
│   ├── schema.ts                 # Definisi tabel: locations, users, user_locations, daily_reports + enums
│   └── seed.ts                   # Seeder akun Admin, Petugas, dan 10 lokasi awal (termasuk IT Bima)
├── lib/
│   ├── auth.ts                   # Konfigurasi NextAuth (Credentials) & helper session/role guard
│   ├── format.ts                 # Helper formatDisplayLocationName(category, name) & tanggal Indonesia
│   └── validators.ts             # Skema validasi Zod untuk lokasi, user, batch laporan, & filter rekap
├── server/
│   ├── services/
│   │   ├── location.service.ts   # CRUD master lokasi & urutan tampilan
│   │   ├── user.service.ts       # CRUD user & assignment multi-lokasi (user_locations)
│   │   ├── report.service.ts     # Batch upsert laporan harian, edit riwayat, & validasi akses lokasi
│   │   ├── recap.service.ts      # Ringkasan harian Admin, filter rentang tanggal, & teks WhatsApp
│   │   └── export.service.ts     # Generator buffer Excel (.xlsx via exceljs) & PDF (jspdf-autotable)
│   └── actions/
│       ├── location.actions.ts   # Server Actions untuk manajemen lokasi (Admin)
│       ├── user.actions.ts       # Server Actions untuk manajemen user & lokasi petugas (Admin)
│       └── report.actions.ts     # Server Actions untuk batch submit & edit riwayat laporan
└── app/
    └── api/
        ├── auth/[...nextauth]/
        │   └── route.ts          # Route handler NextAuth
        └── export/
            ├── excel/route.ts    # Endpoint GET download file .xlsx
            └── pdf/route.ts      # Endpoint GET download file .pdf
tests/
├── unit/
│   ├── format-and-validators.test.ts
│   ├── report.service.test.ts
│   ├── recap.service.test.ts
│   └── export.service.test.ts
```

---

### Task 1: Project Setup, Skema Database Drizzle, & Formatter Lokasi

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `drizzle.config.ts`
- Create: `vitest.config.ts`
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/validators.ts`
- Create: `src/db/seed.ts`
- Test: `tests/unit/format-and-validators.test.ts`

**Interfaces:**
- Produces:
  - `src/db/schema.ts`: exports `userRoleEnum` (`'ADMIN' | 'PETUGAS'`), `reportStatusEnum` (`'ON' | 'OFF'`), `locations`, `users`, `userLocations`, `dailyReports`
  - `src/lib/format.ts`:
    - `formatLocationDisplayName(loc: { category: string; name: string }): string`
    - `formatIndonesianDateHeader(dateStr: string): string`
  - `src/lib/validators.ts`:
    - `locationInputSchema`
    - `userInputSchema`
    - `batchReportInputSchema`
    - `updateReportInputSchema`
    - `recapFilterSchema`

- [ ] **Step 1: Inisialisasi project Next.js TypeScript & install dependencies backend**

Run:
```bash
npm init -y && npm install next react react-dom drizzle-orm pg next-auth bcryptjs zod exceljs jspdf jspdf-autotable && npm install -D typescript @types/node @types/react @types/pg @types/bcryptjs drizzle-kit tsx vitest
```
Expected: `package.json` dan `node_modules` terbentuk tanpa error.

- [ ] **Step 2: Write the failing test untuk formatter nama lokasi dan validasi Zod (`tests/unit/format-and-validators.test.ts`)**

```typescript
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/format-and-validators.test.ts`
Expected: FAIL karena `src/lib/format.ts` dan `src/lib/validators.ts` belum dibuat.

- [ ] **Step 4: Implement `src/db/schema.ts`, `src/db/index.ts`, `src/lib/format.ts`, `src/lib/validators.ts`, dan `src/db/seed.ts`**

Pastikan di `src/db/schema.ts`:
- `locations` memakai `uniqueIndex("locations_category_name_unique").on(table.category, table.name)`
- `userLocations` memakai `uniqueIndex("user_locations_user_location_unique").on(table.userId, table.locationId)`
- `dailyReports` memakai `uniqueIndex("daily_reports_location_date_unique").on(table.locationId, table.reportDate)`
- Di `src/lib/validators.ts`, transform setiap item laporan sehingga jika `status === 'ON'`, nilai `notes` selalu dinormalisasi menjadi `null`.
- Di `src/db/seed.ts`, masukkan daftar lokasi awal:
  `AFT Juanda`, `IT Surabaya`, `IT Bima`, `LPG Surabaya`, `BP Gresik`, `FT Malang`, `FT Madiun`, `FT Tuban`, `FT Camplong`, `FT Bandaran` (dipisahkan menjadi `category` dan `name`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/format-and-validators.test.ts`
Expected: PASS (semua unit test di `format-and-validators.test.ts` hijau).

---

### Task 2: Autentikasi NextAuth & Guard Otorisasi Role/Lokasi

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/server/services/user.service.ts`
- Create: `src/server/services/location.service.ts`

**Interfaces:**
- Consumes: `src/db/schema.ts`, `src/lib/validators.ts`
- Produces:
  - `AuthorizationError` class di `src/lib/auth.ts`
  - `SessionUser` type: `{ id: string; username: string; name: string; role: 'ADMIN' | 'PETUGAS' }`
  - `assertAdmin(user: SessionUser): void`
  - `assertCanAccessLocations(user: SessionUser, requestedLocationIds: string[], assignedLocationIds: string[]): void`
  - `location.service.ts`:
    - `listLocations(options?: { activeOnly?: boolean })`
    - `createLocation(input: { category: string; name: string; sortOrder?: number })`
    - `updateLocation(id: string, input: Partial<{ category: string; name: string; sortOrder: number; isActive: boolean }>)`
  - `user.service.ts`:
    - `createUserWithLocations(input: { username: string; name: string; password: string; role: 'ADMIN' | 'PETUGAS'; locationIds: string[] })`
    - `updateUserLocations(userId: string, locationIds: string[])`
    - `getUserAssignedLocationIds(userId: string): Promise<string[]>`

- [ ] **Step 1: Tambahkan test untuk `assertCanAccessLocations` dan `assertAdmin` di `tests/unit/format-and-validators.test.ts`**

```typescript
import { assertAdmin, assertCanAccessLocations, AuthorizationError } from "../../src/lib/auth";

describe("Authorization guards", () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/format-and-validators.test.ts`
Expected: FAIL karena `src/lib/auth.ts` belum ada.

- [ ] **Step 3: Implement `src/lib/auth.ts`, `src/server/services/location.service.ts`, dan `src/server/services/user.service.ts`**

- `assertCanAccessLocations` langsung lolos jika `user.role === 'ADMIN'`. Jika `'PETUGAS'`, pastikan setiap ID di `requestedLocationIds` ada di dalam `assignedLocationIds`; jika tidak, lempar `new AuthorizationError("Anda tidak memiliki akses ke lokasi tersebut")`.
- `createLocation` dan `updateLocation` memvalidasi input dengan `locationInputSchema` dan menangani constraint `UNIQUE(category, name)` sehingga `IT Surabaya` dan `LPG Surabaya` bisa hidup berdampingan.
- `updateUserLocations` menjalankan transaksi Drizzle: menghapus mapping lama di `user_locations` untuk `userId` tersebut lalu melakukan batch insert untuk `locationIds` yang baru.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/format-and-validators.test.ts`
Expected: PASS.

---

### Task 3: Service Laporan Harian Petugas (Batch Multi-Lokasi Upsert & Edit Riwayat)

**Files:**
- Create: `src/server/services/report.service.ts`
- Create: `src/server/actions/report.actions.ts`
- Test: `tests/unit/report.service.test.ts`

**Interfaces:**
- Consumes: `src/db/schema.ts`, `src/lib/auth.ts`, `src/lib/validators.ts`
- Produces:
  - `prepareBatchReportRecords(user: SessionUser, assignedLocationIds: string[], input: { reportDate: string; items: Array<{ locationId: string; status: 'ON' | 'OFF'; notes?: string | null }> })`
  - `submitBatchDailyReports(user: SessionUser, input: { reportDate: string; items: Array<{ locationId: string; status: 'ON' | 'OFF'; notes?: string | null }> })`
  - `updateHistoricalReport(user: SessionUser, reportId: string, input: { status: 'ON' | 'OFF'; notes?: string | null })`
  - `getOperatorLocationsWithDateStatus(userId: string, reportDate: string)`
  - `getOperatorReportHistory(userId: string, filters?: { locationId?: string; startDate?: string; endDate?: string })`

- [ ] **Step 1: Write the failing test (`tests/unit/report.service.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import { prepareBatchReportRecords, prepareUpdatedReportRecord } from "../../src/server/services/report.service";
import { AuthorizationError } from "../../src/lib/auth";

describe("report.service batch & edit logic", () => {
  const petugas = { id: "user-1", username: "petugas_sby", name: "Budi", role: "PETUGAS" as const };

  it("menyiapkan payload batch upsert untuk beberapa lokasi yang dipegang petugas sekaligus", () => {
    const records = prepareBatchReportRecords(petugas, ["loc-it-sby", "loc-lpg-sby"], {
      reportDate: "2026-11-02",
      items: [
        { locationId: "loc-it-sby", status: "ON", notes: "harus hilang" },
        { locationId: "loc-lpg-sby", status: "OFF", notes: "Off 2 kamera gerbang" },
      ],
    });

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
      { id: "rep-1", locationId: "loc-bp-gresik", status: "OFF", notes: "Off 3" },
      { status: "ON", notes: "Off 3" }
    );
    expect(updated.status).toBe("ON");
    expect(updated.notes).toBeNull();
    expect(updated.updatedBy).toBe("user-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/report.service.test.ts`
Expected: FAIL karena `src/server/services/report.service.ts` belum dibuat.

- [ ] **Step 3: Implement `src/server/services/report.service.ts` dan `src/server/actions/report.actions.ts`**

- `submitBatchDailyReports` menggunakan Drizzle `.insert(dailyReports).values(records).onConflictDoUpdate({ target: [dailyReports.locationId, dailyReports.reportDate], set: { status: sql`excluded.status`, notes: sql`excluded.notes`, updatedBy: sql`excluded.updated_by`, updatedAt: new Date() } })` sehingga 1 klik simpan dari petugas langsung menyimpan atau memperbarui semua lokasi tanpa duplikasi.
- `updateHistoricalReport` memeriksa bahwa lokasi laporan tersebut termasuk dalam `user_locations` milik petugas (atau user adalah `'ADMIN'`), lalu memperbarui `status`, `notes` (`null` bila `'ON'`), `updatedBy`, dan `updatedAt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/report.service.test.ts`
Expected: PASS.

---

### Task 4: Service Rekapitulasi Admin/SPV & Generator Format Teks WhatsApp

**Files:**
- Create: `src/server/services/recap.service.ts`
- Test: `tests/unit/recap.service.test.ts`

**Interfaces:**
- Consumes: `src/lib/format.ts`, `src/db/schema.ts`
- Produces:
  - `buildDailyMonitoringRecap(reportDate: string, activeLocations: Array<{ id: string; category: string; name: string; sortOrder: number }>, reportsForDate: Array<{ locationId: string; status: 'ON' | 'OFF'; notes: string | null; updatedAt?: Date }>): DailyMonitoringSummary`
  - `formatWhatsAppDailyReport(summary: DailyMonitoringSummary): string`
  - `buildDateRangeRecap(filter: { startDate: string; endDate: string; locationId?: string; status?: 'ALL' | 'ON' | 'OFF' | 'UNREPORTED' }, activeLocations: ..., reportsInRange: ...)`

- [ ] **Step 1: Write the failing test (`tests/unit/recap.service.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import { buildDailyMonitoringRecap, formatWhatsAppDailyReport } from "../../src/server/services/recap.service";

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/recap.service.test.ts`
Expected: FAIL karena `src/server/services/recap.service.ts` belum dibuat.

- [ ] **Step 3: Implement `src/server/services/recap.service.ts`**

- Urutkan lokasi berdasarkan `sortOrder` lalu `category` dan `name`.
- Untuk setiap lokasi aktif:
  - Jika belum ada record pada tanggal tersebut -> status item rekap adalah `'UNREPORTED'` (teks WhatsApp: `${displayName} : Belum Lapor.`).
  - Jika `status === 'ON'` -> teks WhatsApp: `${displayName} : On semua.`.
  - Jika `status === 'OFF'` -> jika `notes` terisi, tampilkan `${displayName} : ${notes}` (tambahkan titik di akhir bila belum ada); jika `notes` kosong, tampilkan `${displayName} : Ada Kendala / Off.`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/recap.service.test.ts`
Expected: PASS.

---

### Task 5: Service Export Rekap Bulanan/Rentang Waktu ke Excel (.xlsx) & PDF (.pdf)

**Files:**
- Create: `src/server/services/export.service.ts`
- Create: `src/app/api/export/excel/route.ts`
- Create: `src/app/api/export/pdf/route.ts`
- Test: `tests/unit/export.service.test.ts`

**Interfaces:**
- Consumes: `src/server/services/recap.service.ts`
- Produces:
  - `generateExcelRecapBuffer(recapData: DateRangeRecapResult): Promise<Buffer>`
  - `generatePdfRecapBuffer(recapData: DateRangeRecapResult): Buffer`
  - `GET /api/export/excel?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&locationId=...`
  - `GET /api/export/pdf?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&locationId=...`

- [ ] **Step 1: Write the failing test (`tests/unit/export.service.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildDateRangeRecap } from "../../src/server/services/recap.service";
import { generateExcelRecapBuffer, generatePdfRecapBuffer } from "../../src/server/services/export.service";

describe("export.service Excel & PDF generation", () => {
  const locations = [
    { id: "loc-1", category: "IT", name: "Bima", sortOrder: 1 },
    { id: "loc-2", category: "BP", name: "Gresik", sortOrder: 2 },
  ];

  const recap = buildDateRangeRecap(
    { startDate: "2026-11-01", endDate: "2026-11-02" },
    locations,
    [
      { locationId: "loc-1", reportDate: "2026-11-01", status: "ON", notes: null, reporterName: "Andi" },
      { locationId: "loc-2", reportDate: "2026-11-01", status: "OFF", notes: "Adaptor rusak", reporterName: "Budi" },
    ]
  );

  it("menghasilkan buffer file Excel (.xlsx) yang valid dengan sheet Ringkasan dan Detail Harian", async () => {
    const buffer = await generateExcelRecapBuffer(recap);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    expect(workbook.getWorksheet("Ringkasan Lokasi")).toBeDefined();
    expect(workbook.getWorksheet("Detail Harian")).toBeDefined();
  });

  it("menghasilkan buffer file PDF (%PDF-) yang valid", () => {
    const pdfBuffer = generatePdfRecapBuffer(recap);
    expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/export.service.test.ts`
Expected: FAIL karena `src/server/services/export.service.ts` belum dibuat.

- [ ] **Step 3: Implement `src/server/services/export.service.ts` beserta route handlers `/api/export/excel` dan `/api/export/pdf`**

- Pada `generateExcelRecapBuffer`:
  - Buat 2 worksheet menggunakan `ExcelJS`:
    1. `"Ringkasan Lokasi"`: Kolom `No`, `Kategori`, `Nama Lokasi`, `Label Lokasi (IT Bima, dll.)`, `Jumlah Hari ON`, `Jumlah Hari OFF/Kendala`, `Jumlah Hari Belum Lapor`.
    2. `"Detail Harian"`: Kolom `Tanggal`, `Lokasi`, `Status` (beri warna sel hijau muda untuk `ON`, merah muda untuk `OFF`, abu-abu untuk `Belum Lapor`), `Catatan Kendala`, `Petugas Pelapor`.
- Pada `generatePdfRecapBuffer`:
  - Gunakan `jsPDF` (orientasi landscape) + `autoTable` berisi judul periode laporan, tabel ringkasan per lokasi, dan tabel detail harian.
- Pada Route Handlers `/api/export/excel/route.ts` dan `/api/export/pdf/route.ts`:
  - Periksa session Admin (`assertAdmin`), ambil query `startDate`, `endDate`, `locationId`, `status`, lalu kembalikan `NextResponse` dengan header `Content-Disposition: attachment; filename="Rekap-CCTV-..."`.

- [ ] **Step 4: Run seluruh test suite untuk memverifikasi semua task backend lulus**

Run: `npx vitest run`
Expected: PASS untuk seluruh test unit & service backend.
