# SIAGA-CCTV shadcn/ui Refactor & Confirmation Dialogs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengadopsi library komponen shadcn/ui secara menyeluruh pada aplikasi SIAGA-CCTV, menghilangkan panel Pratinjau Teks WhatsApp di Dashboard Admin agar tabel tampil penuh dan bersih, serta mengimplementasikan dialog konfirmasi modal (`Dialog` & `AlertDialog`) untuk aksi penting (submit batch laporan petugas, modal edit riwayat laporan, dan konfirmasi penambahan lokasi/user).

**Architecture:** Menggunakan komponen shadcn/ui yang dibangun di atas Radix UI primitives dan Tailwind CSS v4. Seluruh interaksi penting yang mengubah data atau mengirim batch laporan dibungkus dalam `AlertDialog` untuk pencegahan salah klik. Form edit riwayat laporan dialihkan dari inline table row menjadi modal `Dialog` terpusat. State dan helper logic tetap modular di `src/lib/ui-state.ts`.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (`@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `class-variance-authority`, `clsx`, `tailwind-merge`), Lucide React.

**Spec:** `/home/w4nn/workbench/SIAGA-CCTV/KONSEP-SIAGA-CCTV.md` & `/home/w4nn/workbench/SIAGA-CCTV/design-system/siaga-cctv/MASTER.md`

## Global Constraints

- Menggunakan komponen resmi shadcn/ui di `src/components/ui/` (`Button`, `Card`, `Dialog`, `AlertDialog`, `Input`, `Textarea`, `Badge`, `Table`, `Select`, `Label`).
- Mendukung mode Terang (Light Mode) dan Gelap (Dark Mode) yang konsisten melalui CSS variables shadcn.
- **Hilangkan panel Pratinjau Teks WhatsApp (`<pre>`) di halaman Dashboard Admin (`/admin`).** Tabel pemantauan status seluruh lokasi harus menempati lebar penuh (full-width) layar. Tombol "Salin Format WhatsApp" tetap ada di header atas dengan feedback notifikasi.
- **AlertDialog Konfirmasi Simpan Laporan Petugas (`/petugas`):** Saat tombol "Simpan Semua Laporan" diklik, form tidak langsung submit tetapi membuka `AlertDialog` konfirmasi: menampilkan tanggal dan daftar lokasi yang akan disimpan statusnya (dengan highlight jika ada lokasi yang OFF).
- **Dialog Modal Edit Riwayat Petugas (`/petugas/riwayat`):** Mengganti pengeditan baris inline tabel dengan popup modal `Dialog` shadcn/ui, sehingga pengguna dapat mengubah status ON/OFF dan catatan kendala dengan fokus tanpa merusak layout tabel.
- **Dialog & AlertDialog Master Data Admin (`/admin/master`):** Konfirmasi sebelum menambah data master lokasi atau akun user baru.

## Review Focus

- Saat petugas membuka `AlertDialog` konfirmasi simpan laporan dan menekan "Batal", form batch tidak tersimpan dan state input tetap utuh tanpa reset.
- Saat modal `Dialog` edit riwayat laporan ditutup (via tombol X atau Batal), perubahan draft edit dibuang dan tidak terkirim ke server.
- Pada halaman `/admin`, penghapusan panel preview WhatsApp tidak merusak fungsi tombol "Salin Format WhatsApp" (teks laporan tetap disalin ke clipboard dengan format harian yang valid).
- Komponen tema Terang dan Gelap shadcn/ui tetap memiliki kontras teks yang memenuhi standar aksesibilitas WCAG AA pada semua dialog dan tabel.

---

### Task 1: Harmonisasi Warna Tema shadcn/ui & Layout/Login Refactor

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/layout/AppNavbar.tsx`
- Modify: `src/components/layout/ThemeToggle.tsx`
- Modify: `src/app/login/page.tsx`
- Test: `tests/unit/ui-state.test.ts`

**Interfaces:**
- Produces:
  - `src/app/globals.css`: variabel warna shadcn yang terhubung harmonis dengan palette Slate-900 & Emerald/Red.
  - `ThemeToggle`: tombol berbasis shadcn `Button` variant `outline`.
  - `AppNavbar`: navbar responsif menggunakan utility `cn` dan token warna card/border shadcn.
  - `/login`: halaman login menggunakan shadcn `Card`, `Input`, `Label`, `Button`.

- [ ] **Step 1: Harmonisasi `src/app/globals.css` untuk token shadcn Light & Dark**
- [ ] **Step 2: Refactor `ThemeToggle.tsx`, `AppNavbar.tsx`, dan `src/app/login/page.tsx` menggunakan komponen shadcn/ui**
- [ ] **Step 3: Run `npx tsc --noEmit && npx vitest run` untuk verifikasi kelulusan tipe & test**

---

### Task 2: Refactor Halaman Petugas — AlertDialog Simpan Batch & Dialog Modal Edit Riwayat

**Files:**
- Modify: `src/components/petugas/BatchReportForm.tsx`
- Modify: `src/components/petugas/ReportHistoryTable.tsx`
- Modify: `src/app/petugas/page.tsx`
- Modify: `src/app/petugas/riwayat/page.tsx`

**Interfaces:**
- Consumes: `src/components/ui/alert-dialog.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/textarea.tsx`, `src/components/ui/table.tsx`
- Produces:
  - `BatchReportForm`:
    - Menggunakan shadcn `Card`, `Badge`, `Button`, `Textarea`.
    - Dilengkapi `AlertDialog` konfirmasi sebelum memanggil `submitBatchDailyReportsAction`. Dialog menampilkan ringkasan jumlah lokasi yang berstatus ON vs OFF sebelum user menekan "Ya, Simpan Laporan".
  - `ReportHistoryTable`:
    - Menggunakan shadcn `Table`, `Badge`, `Button`.
    - Tombol "Edit" membuka popup `Dialog` (`DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`) untuk mengubah status dan catatan kendala laporan tersebut.

- [ ] **Step 1: Implement `BatchReportForm.tsx` dengan shadcn `AlertDialog` konfirmasi**
- [ ] **Step 2: Implement `ReportHistoryTable.tsx` dengan shadcn `Dialog` modal edit**
- [ ] **Step 3: Run `npx tsc --noEmit && npx vitest run` untuk verifikasi**

---

### Task 3: Refactor Halaman Admin — Hilangkan Preview WhatsApp, Full-Width Board, Rekap, & Master Data Dialog

**Files:**
- Modify: `src/components/admin/DailyMonitoringBoard.tsx`
- Modify: `src/components/admin/DateRangeRecapView.tsx`
- Modify: `src/components/admin/MasterDataManager.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/rekap/page.tsx`
- Modify: `src/app/admin/master/page.tsx`

**Interfaces:**
- Consumes: shadcn components (`Table`, `Card`, `Button`, `Badge`, `Dialog`, `AlertDialog`, `Input`, `Label`, `Select`)
- Produces:
  - `DailyMonitoringBoard`:
    - Panel preview WhatsApp dihapus sepenuhnya.
    - Tabel pemantauan harian tampil full-width dengan shadcn `Table` dan `Badge`.
    - Tombol "Salin Format WhatsApp" tetap berfungsi di bagian header.
  - `DateRangeRecapView`:
    - Menggunakan shadcn `Card`, `Table`, `Button`, `Badge`.
  - `MasterDataManager`:
    - Menggunakan shadcn `Card`, `Table`, `Input`, `Button`, `Label`.
    - Penambahan lokasi dan akun pengguna dilengkapi modal `Dialog` atau `AlertDialog` konfirmasi.

- [ ] **Step 1: Implement `DailyMonitoringBoard.tsx` tanpa preview WhatsApp (full width layout)**
- [ ] **Step 2: Implement `DateRangeRecapView.tsx` dengan shadcn `Card` & `Table`**
- [ ] **Step 3: Implement `MasterDataManager.tsx` dengan shadcn `Dialog`/`AlertDialog`**
- [ ] **Step 4: Jalankan verifikasi menyeluruh (`npx tsc --noEmit`, `npx vitest run`, `npx next build`)**
