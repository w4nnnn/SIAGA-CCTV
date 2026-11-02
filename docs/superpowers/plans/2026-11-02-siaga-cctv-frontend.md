# SIAGA-CCTV Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun seluruh antarmuka web (Frontend) SIAGA-CCTV menggunakan Next.js App Router, Tailwind CSS, dan Lucide Icons berpedoman pada Design System `ui-ux-pro-max` (`/home/w4nn/workbench/SIAGA-CCTV/design-system/siaga-cctv/MASTER.md`), mencakup halaman Login, halaman Batch Input Harian & Edit Riwayat untuk Petugas, serta Dashboard Pemantauan Harian, Rekap Rentang Waktu, Export WhatsApp/Excel/PDF, dan Manajemen Master Lokasi/User untuk Admin/SPV.

**Architecture:** Menggunakan Next.js App Router dengan kombinasi Server Components untuk pengambilan data awal dan Client Components interaktif untuk form batch multi-lokasi, modal edit riwayat, salin teks WhatsApp, serta filter/export rekap. Logika state UI dan helper presentasi diisolasi ke dalam modul murni (`src/lib/ui-state.ts`) agar dapat diuji secara otomatis dengan Vitest sebelum diintegrasikan ke komponen React.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide React (`lucide-react`), Design System `ui-ux-pro-max` dengan **Dual Theme (Mode Terang & Mode Gelap)** menggunakan CSS variables (`:root` untuk Light Mode & `.dark` untuk Dark Mode) + `ThemeToggle` yang tersimpan di `localStorage`.

**Spec:** `/home/w4nn/workbench/SIAGA-CCTV/KONSEP-SIAGA-CCTV.md` & `/home/w4nn/workbench/SIAGA-CCTV/design-system/siaga-cctv/MASTER.md`

## Global Constraints

- Mengikuti aturan visual & aksesibilitas `ui-ux-pro-max` di `design-system/siaga-cctv/MASTER.md`:
  - Mendukung **Tema Terang (Light Mode)** dan **Tema Gelap (Dark Mode)** dengan tombol toggle tema (`Sun` / `Moon` icon dengan `aria-label` jelas) di Navbar dan halaman Login.
  - Kontras teks pada Light Mode (`#0F172A` di atas `#FFFFFF`/`#F8FAFC`) dan Dark Mode (`#F8FAFC` di atas `#0F172A`/`#1B2336`) wajib memenuhi standar WCAG AA (> 4.5:1).
  - Gunakan SVG icons (`lucide-react`), dilarang memakai emoji sebagai ikon UI.
  - Semua tombol interaktif wajib memiliki minimal ukuran sentuh `min-h-[44px]`, `cursor-pointer`, transisi halus (`transition-colors duration-200`), dan focus ring yang jelas (`focus-visible:ring-2`).
  - Setiap input wajib memiliki `<label htmlFor="...">` yang terhubung secara eksplisit.
  - Warna semantik status: `ON` menggunakan aksen hijau (`#16A34A` di Light / `#22C55E` di Dark), `Ada Kendala / OFF` menggunakan merah (`#DC2626` di Light / `#EF4444` di Dark), dan `Belum Lapor` menggunakan slate (`#475569` di Light / `#94A3B8` di Dark).
- Halaman Petugas mendukung pengisian sekaligus (*Batch Multi-Location Form*) dengan tombol pintas **"Pilih Semua ON"**, toggle `[ ON ]` / `[ Ada Kendala / OFF ]` per baris lokasi, input **Catatan Kendala (Opsional)** yang hanya muncul ketika baris lokasi tersebut berstatus `OFF`, serta satu tombol **"Simpan Semua Laporan"**.
- Tidak ada input jumlah CCTV OFF sesuai spesifikasi.
- Nama lokasi selalu ditampilkan dengan format `${category} ${name}` (contoh: `IT Bima`, `IT Surabaya`, `LPG Surabaya`).

## Review Focus

- Ketika petugas menekan tombol pintas **"Pilih Semua ON"** pada form batch yang sebelumnya memiliki beberapa lokasi berstatus `'OFF'` dengan catatan kendala -> seluruh lokasi harus berubah menjadi `'ON'` dan catatan kendala pada state form dibersihkan menjadi kosong (`""`), sehingga tidak mengirim catatan lama.
- Ketika petugas memiliki lokasi yang baru sebagian dilaporkan hari ini (misal 2 lokasi sudah lapor, 1 lokasi belum lapor) -> inisialisasi state form batch harus memuat status & catatan lokasi yang sudah lapor apa adanya, dan memberikan default `'ON'` pada lokasi yang belum lapor dengan badge penanda `"Belum Disimpan Hari Ini"` vs `"Sudah Tersimpan"`.
- Pada halaman Riwayat Petugas, ketika petugas mengedit laporan lama dari `'OFF'` menjadi `'ON'` -> field catatan kendala di form edit otomatis disembunyikan dan nilainya di-reset menjadi `null` saat dikirim ke server.
- Pada halaman Rekap & Export Admin, URL unduhan Excel (`/api/export/excel`) dan PDF (`/api/export/pdf`) harus menyertakan parameter filter aktif (`startDate`, `endDate`, `locationId`, `status`) secara akurat.
- Navigasi utama harus menyesuaikan role pengguna (`PETUGAS` melihat menu Input Harian & Riwayat Laporan; `ADMIN` melihat Dashboard Harian, Rekap & Export, Master Lokasi & User, serta tetap bisa mengakses form input).

---

## File Structure (Frontend)

```text
src/
├── lib/
│   └── ui-state.ts                         # Pure state helpers untuk Batch Form, Edit Riwayat, & URL Export
├── components/
│   ├── layout/
│   │   ├── ThemeToggle.tsx                 # Tombol pengubah tema Terang / Gelap (tersimpan di localStorage)
│   │   └── AppNavbar.tsx                   # Navigasi responsif dengan ThemeToggle, indikator Role & Logout
│   ├── petugas/
│   │   ├── BatchReportForm.tsx             # Form input sekaligus multi-lokasi + tombol "Pilih Semua ON"
│   │   └── ReportHistoryTable.tsx          # Tabel riwayat laporan petugas + modal/inline Edit laporan
│   └── admin/
│       ├── DailyMonitoringBoard.tsx        # Kartu metrik ON/OFF/Belum Lapor + Preview & Copy WhatsApp
│       ├── DateRangeRecapView.tsx          # Filter rentang waktu, tabel rekap, & tombol Export Excel/PDF
│       └── MasterDataManager.tsx           # Manajemen Master Lokasi (Category + Name) & Penugasan Petugas
└── app/
    ├── globals.css                         # Konfigurasi Tailwind CSS & variabel tema ui-ux-pro-max
    ├── layout.tsx                          # Root layout dengan font Fira Sans & Fira Code
    ├── page.tsx                            # Redirect otomatis sesuai sesi role (/admin atau /petugas)
    ├── login/
    │   └── page.tsx                        # Halaman Login dengan validasi & feedback loading/error
    ├── petugas/
    │   ├── page.tsx                        # Halaman Input Laporan Harian Sekaligus (Batch)
    │   └── riwayat/
    │       └── page.tsx                    # Halaman Riwayat & Edit Laporan Petugas
    └── admin/
        ├── page.tsx                        # Halaman Dashboard Pemantauan Harian & Copy WhatsApp
        ├── rekap/
        │   └── page.tsx                    # Halaman Rekapitulasi Rentang Tanggal & Export Excel/PDF
        └── master/
            └── page.tsx                    # Halaman Manajemen Master Lokasi & Akun Petugas
tests/
└── unit/
    └── ui-state.test.ts                    # Unit test untuk state form batch, Pilih Semua ON, & URL export
```

---

### Task 1: Konfigurasi Tailwind CSS, Lucide Icons, & Pure UI State Helpers

**Files:**
- Modify: `package.json`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Create: `src/lib/ui-state.ts`
- Test: `tests/unit/ui-state.test.ts`

**Interfaces:**
- Produces:
  - `src/lib/ui-state.ts`:
    - `BatchFormRowState`: `{ locationId: string; displayName: string; status: 'ON' | 'OFF'; notes: string; isAlreadyReported: boolean }`
    - `createInitialBatchFormState(locationsWithStatus: Array<{ locationId: string; displayName: string; report: { status: 'ON' | 'OFF'; notes: string | null } | null }>): BatchFormRowState[]`
    - `applySelectAllOn(rows: BatchFormRowState[]): BatchFormRowState[]`
    - `updateRowStatus(rows: BatchFormRowState[], locationId: string, status: 'ON' | 'OFF'): BatchFormRowState[]`
    - `updateRowNotes(rows: BatchFormRowState[], locationId: string, notes: string): BatchFormRowState[]`
    - `buildExportDownloadUrl(format: 'excel' | 'pdf', filter: { startDate: string; endDate: string; locationId?: string; status?: 'ALL' | 'ON' | 'OFF' | 'UNREPORTED' }): string`

- [ ] **Step 1: Install `lucide-react` dan `@tailwindcss/postcss` `tailwindcss`**

Run:
```bash
npm install lucide-react && npm install -D tailwindcss @tailwindcss/postcss postcss
```
Expected: Paket terinstal tanpa error.

- [ ] **Step 2: Write the failing test (`tests/unit/ui-state.test.ts`)**

```typescript
import { describe, it, expect } from "vitest";
import {
  createInitialBatchFormState,
  applySelectAllOn,
  updateRowStatus,
  updateRowNotes,
  buildExportDownloadUrl,
} from "../../src/lib/ui-state";

describe("ui-state helpers for batch form & export URLs", () => {
  const sampleLocations = [
    {
      locationId: "loc-1",
      displayName: "IT Bima",
      report: null,
    },
    {
      locationId: "loc-2",
      displayName: "BP Gresik",
      report: { status: "OFF" as const, notes: "Off 3 titik" },
    },
  ];

  it("menginisialisasi form batch dengan default ON untuk lokasi yang belum lapor dan mempertahankan data lokasi yang sudah lapor", () => {
    const state = createInitialBatchFormState(sampleLocations);
    expect(state).toEqual([
      {
        locationId: "loc-1",
        displayName: "IT Bima",
        status: "ON",
        notes: "",
        isAlreadyReported: false,
      },
      {
        locationId: "loc-2",
        displayName: "BP Gresik",
        status: "OFF",
        notes: "Off 3 titik",
        isAlreadyReported: true,
      },
    ]);
  });

  it("mengubah semua baris menjadi ON dan mengosongkan notes saat tombol Pilih Semua ON ditekan", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const allOn = applySelectAllOn(initial);
    expect(allOn.every((r) => r.status === "ON" && r.notes === "")).toBe(true);
  });

  it("mengosongkan notes pada baris yang diubah dari OFF ke ON", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const updated = updateRowStatus(initial, "loc-2", "ON");
    expect(updated[1].status).toBe("ON");
    expect(updated[1].notes).toBe("");
  });

  it("memperbarui notes pada baris lokasi yang berstatus OFF", () => {
    const initial = createInitialBatchFormState(sampleLocations);
    const updated = updateRowNotes(initial, "loc-2", "Adaptor kamera gerbang diganti");
    expect(updated[1].notes).toBe("Adaptor kamera gerbang diganti");
  });

  it("menyusun URL download Excel dan PDF lengkap dengan query filter", () => {
    expect(
      buildExportDownloadUrl("excel", {
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        locationId: "loc-1",
        status: "OFF",
      })
    ).toBe(
      "/api/export/excel?startDate=2026-11-01&endDate=2026-11-30&locationId=loc-1&status=OFF"
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/ui-state.test.ts`
Expected: FAIL karena `src/lib/ui-state.ts` belum dibuat.

- [ ] **Step 4: Implement `src/lib/ui-state.ts`, `postcss.config.mjs`, dan `src/app/globals.css`**

Pastikan `src/app/globals.css` memuat token warna dari `design-system/siaga-cctv/MASTER.md` (`--color-background: #0F172A`, `--color-card: #1B2336`, `--color-accent: #22C55E`, `--color-destructive: #EF4444`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/ui-state.test.ts`
Expected: PASS.

---

### Task 2: Layout Utama, Theme Toggle (Terang & Gelap), Navigasi Role-Based, & Halaman Login

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/AppNavbar.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `src/lib/auth.ts`, `src/lib/ui-state.ts`
- Produces:
  - `ThemeToggle`: tombol aksesibel (`min-h-[44px] min-w-[44px]`) dengan ikon `Sun` / `Moon` dari `lucide-react` yang mengubah class `.dark` pada `document.documentElement` dan menyimpannya ke `localStorage` (`siaga-cctv-theme`).
  - `AppNavbar`: menerima `user: SessionUser` dan menampilkan link navigasi sesuai role (`PETUGAS` vs `ADMIN`), `ThemeToggle`, badge nama & role, serta tombol Keluar (Sign Out).
  - `/login`: form autentikasi dengan `ThemeToggle` di pojok kanan atas, `<label htmlFor="username">`, `<label htmlFor="password">`, indikator loading pada tombol submit, dan pesan error kontras tinggi.

- [ ] **Step 1: Implement `src/components/layout/AppNavbar.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, dan `src/app/login/page.tsx`**

Pastikan semua elemen tombol dan link memenuhi checklist `ui-ux-pro-max`:
- `min-h-[44px]` touch target
- SVG icon dari `lucide-react` (`ShieldCheck`, `ClipboardCheck`, `History`, `LayoutDashboard`, `FileSpreadsheet`, `Settings`, `LogOut`) dengan `aria-hidden="true"`
- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`

- [ ] **Step 2: Verifikasi kompilasi TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS tanpa error.

---

### Task 3: Antarmuka Petugas — Form Input Harian Sekaligus (Batch) & Halaman Edit Riwayat

**Files:**
- Create: `src/components/petugas/BatchReportForm.tsx`
- Create: `src/components/petugas/ReportHistoryTable.tsx`
- Create: `src/app/petugas/page.tsx`
- Create: `src/app/petugas/riwayat/page.tsx`

**Interfaces:**
- Consumes:
  - `src/lib/ui-state.ts`
  - `src/server/actions/report.actions.ts` (`submitBatchDailyReportsAction`, `updateHistoricalReportAction`, `getOperatorLocationsWithDateStatusAction`, `getOperatorReportHistoryAction`)
- Produces:
  - `BatchReportForm`:
    - Pemilih tanggal laporan (default: hari ini).
    - Tombol pintas **"Pilih Semua ON"** di header daftar lokasi.
    - Daftar seluruh lokasi yang dipegang petugas (contoh: `IT Bima`, `IT Surabaya`, `LPG Surabaya`), masing-masing dengan badge status simpan (`Sudah Tersimpan` / `Belum Disimpan`) dan tombol toggle besar `[ ON ]` (hijau `#22C55E`) serta `[ Ada Kendala / OFF ]` (merah `#EF4444`).
    - Kolom input `<textarea>` **Catatan Kendala (Opsional)** dengan `<label>` eksplisit yang muncul secara progresif hanya pada baris lokasi yang dipilih `OFF`.
    - Tombol **"Simpan Semua Laporan"** dengan feedback loading dan banner konfirmasi sukses.
  - `ReportHistoryTable`:
    - Filter lokasi & rentang tanggal untuk riwayat petugas.
    - Tombol **Edit** pada setiap baris riwayat yang membuka panel/modal edit status (`ON` / `Ada Kendala / OFF`) dan catatan kendala, lalu memanggil `updateHistoricalReportAction`.

- [ ] **Step 1: Implement `src/components/petugas/BatchReportForm.tsx`, `src/components/petugas/ReportHistoryTable.tsx`, `src/app/petugas/page.tsx`, dan `src/app/petugas/riwayat/page.tsx`**

- [ ] **Step 2: Verifikasi TypeScript & Unit Tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS.

---

### Task 4: Antarmuka Admin/SPV — Dashboard Pemantauan Harian, Rekap Rentang Waktu, Export Excel/PDF, & Master Data

**Files:**
- Create: `src/components/admin/DailyMonitoringBoard.tsx`
- Create: `src/components/admin/DateRangeRecapView.tsx`
- Create: `src/components/admin/MasterDataManager.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/rekap/page.tsx`
- Create: `src/app/admin/master/page.tsx`

**Interfaces:**
- Consumes:
  - `src/server/services/recap.service.ts` (`getDailyMonitoringSummary`, `formatWhatsAppDailyReport`, `getDateRangeRecap`)
  - `src/server/services/location.service.ts` (`listLocations`)
  - `src/server/actions/location.actions.ts`, `src/server/actions/user.actions.ts`
  - `src/lib/ui-state.ts` (`buildExportDownloadUrl`)
- Produces:
  - `DailyMonitoringBoard`:
    - 4 Kartu KPI (`Total Lokasi`, `ON`, `Ada Kendala / OFF`, `Belum Lapor`).
    - Tabel/Grid status seluruh lokasi pada tanggal terpilih.
    - Panel pratinjau teks WhatsApp (dengan font monospace `Fira Code`) dan tombol **"Salin Teks WhatsApp"** beserta feedback `"Tersalin!"`.
  - `DateRangeRecapView`:
    - Filter `Tanggal Mulai`, `Tanggal Akhir` (beserta tombol preset `"Bulan Ini"` dan `"7 Hari Terakhir"`), filter `Lokasi`, dan filter `Status`.
    - Tombol **"Export Excel (.xlsx)"** dan **"Export PDF (.pdf)"** yang mengarah ke `/api/export/excel` dan `/api/export/pdf` sesuai filter aktif.
    - Tabel Ringkasan Kepatuhan per Lokasi (`Hari ON`, `Hari OFF / Kendala`, `Hari Belum Lapor`) dan Tabel Detail Harian.
  - `MasterDataManager`:
    - Form & tabel tambah/edit Lokasi dengan input terpisah `Kategori` (`IT`, `FT`, `AFT`, `LPG`, `BP`) dan `Nama Tempat` (`Bima`, `Surabaya`, dll.) serta pratinjau langsung hasil gabungan (`IT Bima`).
    - Form tambah akun Petugas/Admin dengan checkbox multi-lokasi (`user_locations`) agar Admin bisa menugaskan beberapa lokasi sekaligus ke satu petugas.

- [ ] **Step 1: Implement komponen dan halaman Admin (`DailyMonitoringBoard.tsx`, `DateRangeRecapView.tsx`, `MasterDataManager.tsx`, `/admin`, `/admin/rekap`, `/admin/master`)**

- [ ] **Step 2: Jalankan verifikasi penuh (`npx tsc --noEmit`, `npx vitest run`, dan `npx next build`)**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Semua test lulus dan seluruh halaman Next.js berhasil dikompilasi tanpa error tipe.
