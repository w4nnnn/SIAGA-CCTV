# Spesifikasi Desain: Matriks Riwayat & Edit Interaktif dan Header Bulan Rekap

**Tanggal:** 4 November 2026  
**Status:** Draft untuk Persetujuan  
**Tujuan:** Mengubah tampilan halaman Riwayat & Edit (`/petugas/riwayat`) dari daftar kartu vertikal menjadi Tabel Matriks Tanggal interaktif dengan kolom Nama Lokasi yang dibekukan (*sticky column*) dan header grup bulan 2-baris, serta menyelaraskan format header yang sama pada Matriks Keaktifan di halaman Rekap Admin (`/admin/rekap`).

---

## 1. Latar Belakang & Masalah

1. **Sulit Memantau Riwayat pada Tampilan Kartu Vertikal:**
   - Halaman `/petugas/riwayat` saat ini menampilkan daftar kartu satu per satu ke bawah. Ketika jumlah lokasi dan hari bertambah (misal 10 lokasi x 30 hari = 300 kartu), pengguna kesulitan melihat gambaran utuh lokasi mana yang sudah lapor, belum lapor, atau mengalami kendala pada tanggal tertentu.
2. **Kebutuhan Format Tabel Bergaya Spreadsheet (Freeze Lokasi & Header Bulan):**
   - Sesuai referensi gambar pengguna:
     - **Baris Header 1:** Nama Bulan (misal `"November 2026"`) yang digabung (`colSpan`) secara horizontal di atas kolom-kolom tanggal pada bulan tersebut.
     - **Baris Header 2:** Angka tanggal 2 digit (`01`, `02`, `03`, dst.).
     - **Kolom Pertama (Kiri):** Nama Lokasi yang dibekukan (*sticky left*) agar tidak ikut tergulung saat pengguna menggeser tabel secara horizontal ke kanan.

---

## 2. Pendekatan yang Dipertimbangkan (Approaches)

### Opsi 1 (Dipilih): Tabel Matriks Interaktif Menggantikan Daftar Kartu + Klik Sel untuk Edit/Isi Laporan
- Mengganti daftar kartu vertikal di `/petugas/riwayat` sepenuhnya dengan Tabel Matriks Tanggal interaktif.
- Setiap sel pertemuan `(Lokasi, Tanggal)` menampilkan badge status (`ON`, `OFF`, atau `-` jika belum ada laporan).
- Mengklik sel mana pun (`ON`, `OFF`, maupun `-` kosong) membuka Dialog Koreksi / Input Laporan pada lokasi dan tanggal tersebut:
  - Jika laporan sudah ada (`reportId` tersedia), memanggil `updateHistoricalReportAction` atau upsert laporan.
  - Jika laporan belum ada (sel `-`), memanggil `submitBatchDailyReportsAction` (upsert 1 item untuk tanggal & lokasi tersebut).
- Struktur header 2-baris (Grup Bulan + Tanggal `01`, `02`, ...) dan kolom Nama Lokasi *sticky* juga diterapkan pada Matriks Keaktifan di `/admin/rekap` agar konsisten di seluruh aplikasi.

### Opsi 2: Tabel Matriks di Atas + Daftar Kartu Detail di Bawah
- Menampilkan matriks sebagai ringkasan navigasi di atas dan mempertahankan daftar kartu di bawahnya.
- Tidak dipilih karena membuat halaman terlalu panjang dan menduplikasi informasi yang sudah bisa dilihat langsung lewat dialog klik sel.

---

## 3. Rincian Desain & Arsitektur

### 3.1. Helper Grup Header Bulan & Matriks (`src/lib/view-models.ts` & `src/lib/format.ts`)
1. **Fungsi `groupDatesByMonth(dates: string[])`:**
   - Menerima array tanggal terurut `YYYY-MM-DD`.
   - Mengelompokkan tanggal berurutan berdasarkan `YYYY-MM` menjadi array objek:
     ```ts
     export interface MonthColumnGroup {
       monthKey: string;   // contoh: "2026-11"
       monthLabel: string; // contoh: "November 2026"
       dates: Array<{
         dateStr: string;  // contoh: "2026-11-01"
         dayLabel: string; // contoh: "01"
       }>;
     }
     ```
   - Jika rentang tanggal berada di satu bulan (misal `2026-11-01` s/d `2026-11-30`), menghasilkan 1 grup `"November 2026"` dengan `colSpan = 30`.
   - Jika rentang tanggal melintasi dua bulan (misal preset *30 Hari Terakhir* dari `2026-10-06` s/d `2026-11-04`), otomatis menghasilkan 2 grup (`"Oktober 2026"` dan `"November 2026"`) sesuai jumlah tanggal di masing-masing bulan.

2. **Fungsi `enumerateDateRange(startDate: string, endDate: string): string[]`:**
   - Menghasilkan daftar tanggal berurutan `YYYY-MM-DD` dari `startDate` sampai `endDate` (inklusif) agar matriks selalu menampilkan seluruh kolom tanggal dalam rentang yang dipilih, meskipun pada tanggal tertentu belum ada laporan sama sekali.

### 3.2. Struktur Tabel Matriks & Sticky Column (`Nama Lokasi`)
1. **Header 2 Tingkat (`<thead>`):**
   - **Baris Header 1:**
     - Kolom `Nama Lokasi` menggunakan `rowSpan={2}` dan kelas sticky: `sticky left-0 z-20 bg-muted border-r border-border`.
     - Diikuti oleh `<TableHead colSpan={group.dates.length} className="text-center font-heading text-xs font-bold text-foreground border-b border-l border-border bg-muted/60">` untuk setiap grup bulan (`group.monthLabel`).
     - (Khusus `/admin/rekap` dan `/petugas/riwayat` bila menampilkan kolom ringkasan kanan seperti `Reliabilitas`): menggunakan `rowSpan={2}`.
   - **Baris Header 2:**
     - Berisi deretan sel tanggal `<TableHead className="text-center font-mono text-[11px] font-semibold text-muted-foreground px-1.5 border-l border-border/60 bg-muted/40">` yang menampilkan `dayLabel` (`01`, `02`, `03`, dst.).
2. **Body Baris Lokasi (`<tbody>`):**
   - **Kolom Pertama (`Nama Lokasi`):**
     - Menggunakan `sticky left-0 z-10 bg-card group-hover:bg-muted/40 border-r border-border font-heading text-xs font-semibold text-foreground whitespace-nowrap`.
     - Menampilkan nama lokasi (`row.displayName`, misal `IT Bima`, `FT Tuban`) beserta badge kategori kecil atau langsung nama tampilan lokasi yang bersih.
   - **Kolom Sel Tanggal:**
     - Setiap sel tanggal memiliki garis kisi vertikal tipis (`border-l border-border/50`) menyerupai spreadsheet.
     - Menampilkan status:
       - `ON`: Badge hijau `ON`
       - `OFF`: Badge merah `OFF` (dengan indikator titik/ikon kecil jika memiliki catatan kendala)
       - `UNREPORTED`: Badge abu-abu `-`

### 3.3. Alur Halaman Riwayat & Edit (`/petugas/riwayat`)
1. **Data & Filter Rentang Tanggal:**
   - Secara default menampilkan periode **Bulan Ini** (`YYYY-MM-01` s/d akhir bulan, atau rentang aktif) untuk seluruh lokasi penugasan user (petugas melihat lokasi yang ditugaskan kepadanya; admin melihat seluruh lokasi aktif).
   - Dilengkapi Toolbar Filter dengan Preset Rentang (*Hari Ini*, *7 Hari Terakhir*, *Bulan Ini*, *30 Hari Terakhir*), input *Dari Tanggal* & *Sampai Tanggal*, filter *Lokasi Penugasan*, dan filter *Status*.
2. **Interaksi Klik Sel (Detail & Edit Modal):**
   - Setiap sel tanggal pada matriks `/petugas/riwayat` adalah tombol interaktif (`cursor-pointer hover:ring-1 hover:ring-primary`).
   - Saat sel diklik, terbuka Dialog **Detail & Koreksi Laporan**:
     - Menampilkan informasi **Lokasi** dan **Tanggal Laporan** (diformat lengkap, misal `Rabu, 04 November 2026`).
     - Menampilkan metadata audit (Nama Pelapor & Waktu Pembaruan terakhir) jika laporan sudah tercatat.
     - Menyediakan pemilih status **ON SEMUA** / **ADA KENDALA (OFF)** dan input **Catatan Kendala** (ketika `OFF`).
     - Saat tombol **Simpan Perubahan Laporan** ditekan:
       - Jika sel sebelumnya sudah memiliki `id` laporan, memanggil `updateHistoricalReportAction(id, { status, notes })`.
       - Jika sel sebelumnya masih kosong (`UNREPORTED`), memanggil `submitBatchDailyReportsAction({ reportDate, items: [{ locationId, status, notes }] })`.
       - Setelah berhasil, menampilkan notifikasi toast dan memperbarui tampilan matriks.

---

## 4. File yang Disentuh

1. **`src/lib/view-models.ts`:**
   - Menambahkan `enumerateDateRange(startDate, endDate)` dan `groupDatesByMonth(dates)`.
   - Memperbarui `buildActivityMatrix(recap)` agar menggunakan rentang tanggal penuh `enumerateDateRange(recap.startDate, recap.endDate)` dan menyertakan `monthGroups`.
   - Menambahkan helper `buildOperatorHistoryMatrix(...)` untuk membangun matriks riwayat interaktif beserta detail per sel (`id`, `status`, `notes`, `reporterName`, `updatedAt`).
2. **`src/server/services/report.service.ts` & `src/app/(app)/petugas/riwayat/page.tsx`:**
   - Menambahkan pengambilan daftar lokasi penugasan aktif untuk petugas (`getAssignedLocationsForUser`) agar baris matriks lokasi selalu lengkap meskipun lokasi tersebut belum pernah dilaporkan.
3. **`src/components/petugas/ReportHistoryTable.tsx`:**
   - Mengganti daftar kartu vertikal dengan Tabel Matriks interaktif (kolom Nama Lokasi *sticky*, header Bulan 2-baris, tanggal `01`, `02`, dst., preset rentang tanggal, dan dialog klik-untuk-edit/isi).
4. **`src/components/admin/DateRangeRecapView.tsx`:**
   - Memperbarui Tabel Matriks Keaktifan agar menggunakan header 2-baris (Nama Bulan + Tanggal `01`, `02`, dst.) dan kolom Nama Lokasi *sticky left*.
5. **`tests/unit/view-models.test.ts`:**
   - Menambahkan unit test untuk `enumerateDateRange`, `groupDatesByMonth`, dan `buildOperatorHistoryMatrix`.

---

## 5. Kriteria Verifikasi

1. Header baris pertama pada tabel matriks menampilkan Nama Bulan dalam bahasa Indonesia yang di-*merge* (`colSpan`) di atas kolom tanggalnya.
2. Header baris kedua menampilkan angka tanggal 2 digit (`01`, `02`, `03`, dst.).
3. Kolom `Nama Lokasi` tetap terkunci (*sticky*) di sebelah kiri saat tabel di-scroll ke kanan pada layar sempit maupun rentang 30 hari.
4. Di halaman `/petugas/riwayat`, mengklik sel tanggal (`ON`, `OFF`, maupun `-`) membuka dialog edit/input laporan dan menyimpan perubahan dengan benar ke database.
5. `npm run test`, `npm run typecheck`, dan `npm run build` berjalan sukses tanpa error.
