# SIAGA-CCTV

**Sistem Informasi & Pengawasan Operasional Surveillance CCTV Multi-Lokasi**  
*PT. Merpati Putih Jaya*

---

## 📌 Tentang Sistem

**SIAGA-CCTV** adalah platform berbasis web modern yang dirancang untuk mendigitalisasi pelaporan harian kondisi operasional CCTV di seluruh terminal dan unit operasi PT. Merpati Putih Jaya. Sistem ini menggantikan proses pelaporan manual via grup WhatsApp menjadi alur terpusat dengan integritas audit yang transparan, pemantauan real-time bagi Supervisor (SPV), dan otomatisasi pembuatan berkas laporan (Excel & PDF).

### Masalah yang Diselesaikan:
- **Pelaporan Terfragmentasi:** Menghilangkan risiko data laporan tercecer di grup percakapan pesan instan.
- **Deteksi Kepatuhan Real-time:** Mengetahui secara instan titik lokasi mana yang belum melapor pada shift berjalan (*unreported*).
- **Efisiensi Rekapitulasi:** Meniadakan proses rekap manual berjam-jam saat akhir bulan dengan fitur ekspor otomatis satu klik ke format Excel (.xlsx) berpewarnaan sel dan dokumen cetak PDF resmi.

---

## ✨ Fitur Utama

### 1. Panel Supervisor / Administrator (`ADMIN`)
- **Dashboard Pemantauan Harian:**
  - Status kondisi harian real-time: **ON** (Normal), **OFF** (Ada Kendala), atau **Belum Lapor**.
  - Metrik agregat kepatuhan shift (*compliance rate*), rasio titik aktif, dan alarm kendala.
  - Salin Cepat Format WhatsApp (*Quick-Copy WhatsApp Summary*) yang siap dipaste ke grup pimpinan dengan satu klik.
  - Filter pencarian cepat berdasarkan kategori unit (IT, FT, AFT, LPG, BP) dan pencarian nama lokasi.
- **Rekapitulasi & Ekspor Berkas Audit:**
  - Pilihan preset rentang tanggal terpadu: **Hari Ini**, **7 Hari Terakhir**, **Bulan Ini (Kalender Penuh)**, dan **30 Hari Terakhir**, serta rentang tanggal kustom.
  - Matriks kepatuhan harian visual per lokasi sepanjang rentang waktu yang dipilih.
  - Ekspor **Excel (.xlsx)** profesional dengan pewarnaan status otomatis (hijau untuk ON, merah untuk kendala/OFF) menggunakan `ExcelJS`.
  - Ekspor **PDF (.pdf)** siap cetak format *landscape* dengan tabel audit lengkap menggunakan `jsPDF` + `AutoTable`.
- **Master Data & Manajemen Hak Akses:**
  - Manajemen titik lokasi operasional, kategori, urutan sortir (*sort order*), dan status aktif.
  - Manajemen pengguna (Admin & Petugas Lapangan).
  - Penugasan wilayah multi-lokasi berbasis arsitektur *many-to-many* (satu petugas dapat bertanggung jawab atas beberapa titik lokasi sekaligus).

### 2. Panel Petugas Lapangan (`PETUGAS`)
- **Input Laporan Harian Terpadu:**
  - Tombol aksi cepat *"Tandai Semua ON"* untuk efisiensi penginputan harian di lapangan.
  - Kendali status independen per titik lokasi (ON / OFF).
  - Kotak catatan kendala yang otomatis diwajibkan saat status kamera OFF.
  - Antarmuka ramah perangkat bergerak (*mobile-responsive*) untuk kemudahan input dari smartphone.
- **Riwayat & Koreksi Laporan:**
  - Riwayat lengkap pelaporan per lokasi dengan penanda pembaruan terakhir.
  - Modal koreksi data untuk memperbarui status CCTV pasca perbaikan teknisi di lapangan.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | React 19, Turbopack, Server Actions, Route Handlers |
| **Bahasa** | TypeScript | *Strict Type-Safety* dari layer database hingga UI |
| **Styling** | Tailwind CSS v4 & Base UI | Desain modern bertema gelap (*Dark Mode First*) |
| **Database** | PostgreSQL | Penyimpanan relasional ACID-compliant |
| **ORM** | Drizzle ORM & Drizzle Kit | Typesafe schema, query builder, dan migrasi SQL |
| **Autentikasi** | NextAuth.js (Auth.js v5) | Session-based authentication & role guard (`ADMIN`, `PETUGAS`) |
| **Ekspor Dokumen** | ExcelJS & jsPDF | Pembentukan berkas laporan spreadsheet & PDF di sisi server |
| **Testing** | Vitest | 44 unit tests untuk logika bisnis, view-model, dan generator |
| **Kontainerisasi** | Docker & Docker Compose | Multi-stage standalone build (~79 MB content size) |

---

## 🚀 Panduan Memulai Cepat

### Prasyarat
- **Node.js** `>= 20.x` (Disarankan Node.js 22 LTS atau 24)
- **npm** `>= 10.x`
- **PostgreSQL** `>= 16.x` (Lokal atau via Docker)

---

### Langkah Instalasi (Local Development)

1. **Clone Repositori & Masuk Direktori:**
   ```bash
   git clone <url-repository>
   cd SIAGA-CCTV
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable:**
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan variabel di dalam `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/siaga_cctv
   AUTH_SECRET=buat-string-acak-rahasia-minimal-32-karakter-disini
   AUTH_TRUST_HOST=true
   ```

4. **Jalankan Migrasi Database:**
   ```bash
   npm run db:migrate
   ```

5. **Isi Data Awal / Data Simulasi:**
   Pilih salah satu metode seeding berikut:
   
   - **Opsi A: Seed Simulasi 1 Bulan Penuh (Direkomendasikan untuk Uji Coba)**
     Menyiapkan 1 Admin, 3 Petugas terbagi 3 rayon, dan 300 data transaksi laporan harian 30 hari terakhir tanpa hari bolong:
     ```bash
     npm run db:seed:simulasi
     ```
   
   - **Opsi B: Seed Master Awal Saja**
     Hanya menyiapkan 10 master lokasi dan akun admin/petugas awal tanpa histori transaksi:
     ```bash
     npm run db:seed
     ```

6. **Jalankan Server Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 👥 Akun Demo Bawaan (Hasil Seed Simulasi)

| Username | Password | Role | Cakupan Wilayah / Penugasan |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `ADMIN` | Akses Penuh Seluruh Titik Terminal |
| `petugas_1` | `petugas123` | `PETUGAS` | Rayon Surabaya (AFT Juanda, IT Surabaya, LPG Surabaya, BP Gresik) |
| `petugas_2` | `petugas123` | `PETUGAS` | Rayon Barat & Selatan (FT Malang, FT Madiun, FT Tuban) |
| `petugas_3` | `petugas123` | `PETUGAS` | Rayon Madura & Kepulauan (IT Bima, FT Camplong, FT Bandaran) |

---

## 🐳 Menjalankan dengan Docker & Docker Compose

Aplikasi ini dilengkapi dengan konfigurasi **Docker Multi-Stage Build** (Next.js Standalone Mode) dan **Docker Compose** yang menyertakan database PostgreSQL siap pakai.

### 1. Jalankan Seluruh Sistem (Database + Web App):
```bash
npm run docker:up
# atau: docker compose up -d
```
Aplikasi akan otomatis menginisialisasi kontainer PostgreSQL 18 dan Next.js pada port `3000`.

### 2. Jalankan Migrasi & Seed di dalam Docker:
```bash
# Menjalankan migrasi database
docker compose exec app npx drizzle-kit migrate

# Mengisi 300 data simulasi 1 bulan
docker compose exec app npx tsx src/db/seed-simulation.ts
```

### 3. Menghentikan Kontainer:
```bash
npm run docker:down
# atau: docker compose down
```

---

## 📋 Daftar Skrip NPM (`package.json`)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan Next.js lokal |
| `npm run build` | Melakukan kompilasi produksi Next.js (Standalone output) |
| `npm run start` | Menjalankan server produksi hasil build lokal |
| `npm run test` | Menjalankan seluruh pengujian unit test menggunakan Vitest |
| `npm run typecheck` | Menjalankan validasi tipe TypeScript (`tsc --noEmit`) |
| `npm run db:generate` | Menghasilkan berkas migrasi SQL baru dari skema Drizzle |
| `npm run db:migrate` | Menerapkan migrasi skema database ke PostgreSQL |
| `npm run db:seed` | Mengisi master data lokasi dan akun pengguna awal |
| `npm run db:seed:simulasi` | Mengisi data simulasi operasional 30 hari penuh (300 record) |
| `npm run docker:build` | Membangun image Docker produksi (`siaga-cctv:latest`) |
| `npm run docker:up` | Menjalankan database dan web app via Docker Compose di latar belakang |
| `npm run docker:down` | Menghentikan dan membersihkan kontainer Docker Compose |

---

## 🧪 Pengujian & Jaminan Mutu

Seluruh modul bisnis, kalkulasi rekapitulasi, view-model, dan validator dilindungi oleh unit test Vitest:

```bash
# Menjalankan pengujian otomatis
npm run test

# Memeriksa kepatuhan tipe TypeScript
npm run typecheck
```

---

## 📄 Hak Cipta & Kepemilikan

Sistem ini dikembangkan khusus untuk kebutuhan operasional pengawasan dan pelaporan CCTV **PT. Merpati Putih Jaya**. Seluruh hak cipta dilindungi undang-undang.
