# Spesifikasi Desain: Seed Simulasi 1 Bulan SIAGA-CCTV

**Tanggal:** 3 November 2026  
**Status:** Draft untuk Persetujuan  
**Tujuan:** Menyediakan skrip seed baru untuk simulasi data operasional pemantauan CCTV selama 30 hari penuh dengan 1 Admin dan 3 Petugas, tanpa hari bolong (100% dilaporkan), menggunakan pendekatan Clean Wipe.

---

## 1. Latar Belakang & Kebutuhan

Sistem SIAGA-CCTV membutuhkan dataset simulasi yang kaya dan realistis untuk menguji serta mendemonstrasikan fitur-fitur seperti:
- Dashboard pemantauan harian (Daily Monitoring Board)
- Rekapitulasi rentang tanggal dan matriks kehadiran status (Date Range Recap)
- Ekspor laporan ke PDF dan Excel
- Riwayat laporan per petugas dan per lokasi

Kebutuhan spesifik:
1. **User Role:** 1 Admin dan 3 Petugas.
2. **Cakupan Wilayah:** 10 Lokasi terdistribusi habis ke 3 Petugas.
3. **Rentang Waktu:** 30 hari terakhir (termasuk hari ini), 30 hari x 10 lokasi = 300 data laporan.
4. **Status Laporan:** Tanpa laporan bolong (100% terlaporkan), mayoritas ON (~85-90%) dan minoritas OFF (~10-15%) dilengkapi catatan kendala realistis.
5. **Pendekatan:** Pendekatan 2 (Clean Wipe & Fresh Insert) menggunakan transaksi database agar data hasil seed konsisten dan bersih dari residu data lama.

---

## 2. Pendekatan yang Dipertimbangkan

- **Pendekatan 1: Standalone Idempotent Script**  
  *Deskripsi:* Menggunakan `onConflictDoUpdate` / `onConflictDoNothing` tanpa menghapus data yang ada.  
  *Kelemahan:* Jika sebelumnya ada data laporan di luar rentang 30 hari, data tersebut akan tetap muncul dan mempengaruhi total rekap.
  
- **Pendekatan 2: Clean Wipe & Fresh Insert (Dipilih)**  
  *Deskripsi:* Menghapus data transaksi `daily_reports`, `user_locations`, dan user simulasi lama dalam satu transaksi atomik sebelum memasukkan data baru.  
  *Kelebihan:* Menjamin data database tepat 300 record laporan untuk 30 hari terakhir, bersih, terprediksi, dan ideal untuk demonstrasi maupun verifikasi fitur ekspor/rekap.

---

## 3. Detail Data & Alokasi

### 3.1. Akun Pengguna

| Username | Nama Lengkap | Role | Password Default | Wilayah / Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | Supervisor CCTV | `ADMIN` | `admin123` | Seluruh Lokasi (Akses Penuh) |
| `petugas_1` | Petugas Rayon Surabaya | `PETUGAS` | `petugas123` | Rayon 1 (4 Lokasi) |
| `petugas_2` | Petugas Rayon Barat & Selatan | `PETUGAS` | `petugas123` | Rayon 2 (3 Lokasi) |
| `petugas_3` | Petugas Rayon Madura & Kepulauan | `PETUGAS` | `petugas123` | Rayon 3 (3 Lokasi) |

### 3.2. Pemetaan Lokasi ke Petugas (10 Lokasi Master)

1. **Petugas 1 (`petugas_1`) - 4 Lokasi:**
   - AFT Juanda
   - IT Surabaya
   - LPG Surabaya
   - BP Gresik
2. **Petugas 2 (`petugas_2`) - 3 Lokasi:**
   - FT Malang
   - FT Madiun
   - FT Tuban
3. **Petugas 3 (`petugas_3`) - 3 Lokasi:**
   - IT Bima
   - FT Camplong
   - FT Bandaran

### 3.3. Transaksi Laporan Harian (Daily Reports)

- **Rentang Tanggal:** $T - 29$ sampai dengan $T$ (30 hari berturut-turut).
- **Format Tanggal:** `YYYY-MM-DD`.
- **Integritas Relasi:**
  - `locationId`: ID lokasi terkait.
  - `reportedBy` & `updatedBy`: ID petugas penanggung jawab lokasi tersebut.
  - `status`: `"ON"` (probabilitas ~88%) atau `"OFF"` (probabilitas ~12%).
  - `notes`: 
    - Jika `"ON"`: `null` atau catatan operasional normal (opsional, mayoritas `null`).
    - Jika `"OFF"`: Variasi kendala realistis (misal: *"Koneksi jaringan terputus (RTO)"*, *"Kamera buram / lensa terhalang debu"*, *"NVR restart / power supply unit failure"*, *"Perbaikan jalur fiber optik area tangki"*, *"Kamera offline pasca pemadaman PLN"*).

---

## 4. Rencana Implementasi

1. **File Baru:** `src/db/seed-simulation.ts`
   - Menggunakan Drizzle ORM `db.transaction()` untuk eksekusi atomik.
   - Langkah transaksi:
     1. Pastikan 10 master lokasi tersedia (insert or query).
     2. Hapus data `daily_reports`.
     3. Hapus data `user_locations`.
     4. Buat / perbarui akun `admin`, `petugas_1`, `petugas_2`, `petugas_3` dengan hash bcrypt.
     5. Hubungkan `user_locations` sesuai alokasi rayon.
     6. Lakukan loop 30 hari untuk 10 lokasi (300 record), tentukan status dan notes, lalu batch insert ke `daily_reports`.
   - Logging ringkasan eksekusi yang informatif di terminal (jumlah hari, total laporan, rasio ON/OFF).

2. **Perubahan Skrip `package.json`:**
   - Tambahkan skrip baru:
     ```json
     "db:seed:simulasi": "tsx --env-file=.env src/db/seed-simulation.ts"
     ```
   - Skrip default `"db:seed"` tetap mempertahankan `src/db/seed.ts` asli tanpa diubah.

---

## 5. Kriteria Verifikasi

1. Skrip `npm run db:seed:simulasi` berhasil dieksekusi tanpa error.
2. Query ke database membuktikan:
   - Ada 1 user ADMIN dan 3 user PETUGAS.
   - Ada 10 record di `user_locations`.
   - Ada tepat 300 record di `daily_reports` (10 lokasi x 30 hari).
   - Seluruh record memiliki relasi `reportedBy` yang sesuai dengan penugasan wilayah.
   - Terdapat variasi status ON dan OFF dengan notes yang sesuai pada status OFF.
3. `npm run typecheck` dan `npm run test` tetap berjalan bersih (0 error).
