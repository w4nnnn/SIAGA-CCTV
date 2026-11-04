# Matriks Riwayat & Edit Interaktif dan Header Bulan Rekap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah halaman Riwayat & Edit (`/petugas/riwayat`) menjadi Tabel Matriks Tanggal interaktif dengan kolom Nama Lokasi yang dibekukan (*sticky column*) dan header grup Bulan 2-baris, serta menyelaraskan format header yang sama pada Matriks Keaktifan di halaman Rekap Admin (`/admin/rekap`).

**Architecture:** Menambahkan fungsi murni di `src/lib/format.ts` dan `src/lib/view-models.ts` untuk mengelompokkan deretan tanggal ke dalam grup bulan (`MonthColumnGroup`) dan membangun matriks riwayat interaktif (`buildOperatorHistoryMatrix`). Menyediakan daftar lokasi penugasan aktif dari `report.service.ts` ke halaman `/petugas/riwayat`, lalu merender tabel matriks dengan kolom kiri `sticky left-0` dan dialog klik-sel untuk mengedit (`updateHistoricalReportAction`) atau menambah laporan baru (`submitBatchDailyReportsAction`).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-matrix-riwayat-dan-rekap-design.md`

## Global Constraints

- Baris Header 1 menampilkan Nama Bulan dalam bahasa Indonesia (misal `"November 2026"`) yang digabung (`colSpan`) melintasi kolom-kolom tanggal pada bulan tersebut.
- Baris Header 2 menampilkan angka tanggal 2 digit (`01`, `02`, `03`, dst.).
- Kolom pertama (`Nama Lokasi`) dibekukan (*sticky left*) agar tetap terlihat saat tabel digeser secara horizontal.
- Di halaman `/petugas/riwayat`, mengklik sel tanggal (`ON`, `OFF`, maupun `-` belum lapor) membuka dialog untuk melihat detail, mengedit laporan yang sudah ada, atau mengisi laporan baru pada tanggal dan lokasi tersebut.

## Review Focus

- Rentang tanggal terbalik (`startDate > endDate`) pada `enumerateDateRange` harus mengembalikan array kosong tanpa infinite loop.
- Rentang tanggal lintas bulan/tahun (misal `2026-10-30` s/d `2026-11-02`) pada `groupDatesByMonth` harus menghasilkan 2 grup bulan berurutan dengan `colSpan` yang tepat.
- Filter status (`ON`, `OFF`, `UNREPORTED`) pada matriks riwayat petugas harus menyaring baris lokasi yang memiliki setidaknya satu sel dengan status tersebut (atau menampilkan semua lokasi jika `ALL`).
- Lokasi penugasan yang belum memiliki laporan sama sekali dalam rentang tanggal tetap muncul sebagai baris di matriks `/petugas/riwayat` dengan seluruh sel berstatus `UNREPORTED` (`-`).
- Saat sel `UNREPORTED` (`-`) diklik lalu disimpan di dialog `/petugas/riwayat`, sistem memanggil `submitBatchDailyReportsAction` untuk membuat laporan baru pada tanggal dan lokasi tersebut.

---

### Task 1: Helper Format Bulan & View-Model Matriks Grup Bulan

**Files:**
- Modify: `src/lib/format.ts`
- Modify: `src/lib/view-models.ts`
- Test: `tests/unit/view-models.test.ts`

**Interfaces:**
- Produces:
  - `formatIndonesianMonthYear(monthKeyOrDate: string): string` in `src/lib/format.ts`
  - `enumerateDateRange(startDate: string, endDate: string): string[]` in `src/lib/view-models.ts`
  - `MonthColumnGroup` interface & `groupDatesByMonth(dates: string[]): MonthColumnGroup[]` in `src/lib/view-models.ts`
  - Updated `buildActivityMatrix(recap: DateRangeRecapResult)` in `src/lib/view-models.ts` returning `{ dates, monthGroups, rows }`
  - `OperatorHistoryCell`, `OperatorHistoryLocationInput`, `OperatorHistoryReportInput`, `buildOperatorHistoryMatrix(...)` in `src/lib/view-models.ts`

- [ ] **Step 1: Write the failing tests in `tests/unit/view-models.test.ts`**

Add tests for `formatIndonesianMonthYear`, `enumerateDateRange`, `groupDatesByMonth`, `buildActivityMatrix` (with `monthGroups` and full date enumeration), and `buildOperatorHistoryMatrix`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/view-models.test.ts`
Expected: FAIL with missing exports `enumerateDateRange`, `groupDatesByMonth`, `buildOperatorHistoryMatrix`.

- [ ] **Step 3: Implement `formatIndonesianMonthYear` in `src/lib/format.ts` and matrix helpers in `src/lib/view-models.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/view-models.test.ts`
Expected: PASS

---

### Task 2: Service Lokasi Penugasan & Halaman Server `/petugas/riwayat`

**Files:**
- Modify: `src/server/services/report.service.ts`
- Modify: `src/app/(app)/petugas/riwayat/page.tsx`
- Test: `tests/unit/report.service.test.ts`

**Interfaces:**
- Consumes: `formatLocationDisplayName` from `src/lib/format.ts`
- Produces:
  - `getAssignedLocationsForUser(user: SessionUser)` in `src/server/services/report.service.ts` returning `Array<{ id: string; category: string; name: string; displayName: string; sortOrder: number }>`
  - Updated `PetugasHistoryPage` passing `locations` and `items` to `ReportHistoryTable`

- [ ] **Step 1: Add unit test / check for location formatting & service helper in `tests/unit/report.service.test.ts`**

- [ ] **Step 2: Implement `getAssignedLocationsForUser` in `src/server/services/report.service.ts` and update `src/app/(app)/petugas/riwayat/page.tsx`**

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run tests/unit/report.service.test.ts`
Expected: PASS

---

### Task 3: Komponen Matriks Interaktif `ReportHistoryTable.tsx` & Penyelarasan `DateRangeRecapView.tsx`

**Files:**
- Modify: `src/components/petugas/ReportHistoryTable.tsx`
- Modify: `src/components/admin/DateRangeRecapView.tsx`

**Interfaces:**
- Consumes:
  - `buildOperatorHistoryMatrix`, `buildActivityMatrix`, `detectActivePreset`, `getRangePreset`, `getLastDayOfMonth` from `src/lib/view-models.ts`
  - `submitBatchDailyReportsAction`, `updateHistoricalReportAction` from `src/server/actions/report.actions.ts`

- [ ] **Step 1: Update `src/components/admin/DateRangeRecapView.tsx` matrix table**
  - Gunakan `matrix.monthGroups` untuk baris header 1 (`colSpan={group.dates.length}`) dan `dayLabel` (`01`, `02`, dst.) untuk baris header 2.
  - Bekukan kolom `Nama Lokasi` dengan `sticky left-0 z-20 bg-card border-r border-border` (dan `z-30 bg-muted` di header).

- [ ] **Step 2: Update `src/components/petugas/ReportHistoryTable.tsx` menjadi Tabel Matriks Interaktif**
  - Tambahkan preset rentang tanggal (*Hari Ini*, *7 Hari Terakhir*, *Bulan Ini*, *30 Hari Terakhir*) dengan default *Bulan Ini* (atau 30 hari terakhir jika bulan berjalan belum memiliki data).
  - Render tabel matriks dengan header 2-baris (Nama Bulan + Tanggal `01`, `02`, dst.) dan kolom `Nama Lokasi` yang dibekukan (`sticky left-0`).
  - Setiap sel tanggal dapat diklik untuk membuka Dialog **Detail & Koreksi Laporan** (mendukung edit laporan `ON`/`OFF` yang sudah ada maupun pengisian laporan baru pada sel `-` yang belum lapor).

- [ ] **Step 3: Run full verification (`npm run test`, `npm run typecheck`, `npm run build`)**

Run: `npm run test && npm run typecheck && npm run build`
Expected: All unit tests pass, 0 TypeScript errors, Next.js production build succeeds.
