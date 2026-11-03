# Konsep & Desain Sistem SIAGA-CCTV

Tanggal: 02 November 2026
Status: Draft Konsep (Menunggu Persetujuan)

---

## 1. Latar Belakang & Tujuan (Intent & Why)
Saat ini pelaporan kondisi harian CCTV dari berbagai lokasi operasional (seperti AFT Juanda, IT Surabaya, IT Bima, LPG Surabaya, BP Gresik, FT Malang, FT Madiun, FT Tuban, FT Camplong, FT Bandaran, dll.) dikirim secara manual melalui pesan teks WhatsApp. Cara ini menyulitkan Admin/SPV ketika harus memantau lokasi mana yang belum melapor hari ini serta saat harus membuat rekapitulasi bulanan atau rentang waktu tertentu.

Sistem berbasis web **SIAGA-CCTV** bertujuan menggantikan pengumpulan laporan manual dengan input mandiri oleh petugas di masing-masing lokasi melalui antarmuka web yang sangat sederhana, sekaligus menyediakan dashboard pemantauan real-time dan fitur rekap/export (Excel, PDF, dan format teks WhatsApp) bagi Admin/SPV.

---

## 2. Cakupan Sistem (Goals, Non-Goals, & Anti-Goals)

### Goals (Target Utama)
1. Memungkinkan petugas tiap lokasi login dan menginput laporan harian status CCTV dengan cepat (hanya memilih "ON Semua" atau "Ada Kendala / OFF").
2. Memungkinkan petugas mengedit kembali riwayat laporan lokasi mereka (jika ada salah input atau pembaruan kondisi CCTV).
3. Menyediakan dashboard bagi Admin/SPV untuk memantau status laporan seluruh lokasi pada hari ini (ON Semua, Ada Kendala/OFF, atau Belum Lapor) maupun pada rentang tanggal tertentu.
4. Menyediakan fitur export laporan ke format **Excel (.xlsx)** dan **PDF (.pdf)** untuk laporan bulanan atau rentang waktu pilihan, serta tombol salin teks format WhatsApp harian.
5. Menyediakan manajemen data master Lokasi dan Akun Pengguna (Petugas & Admin/SPV).

### Non-Goals (Di Luar Cakupan Saat Ini)
1. Integrasi streaming video live CCTV (RTSP/IP Camera) langsung di dalam website.
2. Pemantauan detail per titik/ID kamera secara individual (sistem fokus pada status agregat per lokasi sesuai format laporan harian).
3. Notifikasi otomatis via WhatsApp Gateway berbayar (cukup fitur copy-paste format WhatsApp dari dashboard).

### Anti-Goals (Hal yang Harus Dihindari)
1. Form input petugas yang rumit atau memiliki terlalu banyak field wajib sehingga memperlambat pelaporan harian dari HP/desktop.
2. Ketergantungan pada layanan BaaS eksternal berbayar yang menyulitkan deployment di server internal/VPS sendiri.

---

## 3. Pendekatan Arsitektur (Approaches Considered)

### Pendekatan 1: Next.js Fullstack Monolith + Drizzle ORM + PostgreSQL + NextAuth (Terpilih)
- Seluruh frontend dan backend (Server Actions / Route Handlers) berada dalam satu repositori Next.js (App Router) dengan TypeScript.
- Database relasional menggunakan PostgreSQL yang diakses melalui Drizzle ORM (type-safe, ringan, dan performa tinggi).
- Autentikasi berbasis session/JWT menggunakan NextAuth.js (Auth.js) dengan Credentials Provider.
- **Kelebihan:** Mandiri, tipe data aman dari database hingga UI, performa query cepat, mudah di-deploy di VPS atau server internal perusahaan.

### Pendekatan 2: Next.js + Supabase BaaS (Tidak Dipilih)
- Menggunakan layanan cloud Supabase untuk database dan autentikasi.
- **Kekurangan:** Ketergantungan pada cloud pihak ketiga dan kurang fleksibel jika sistem ingin dijalankan secara mandiri di lingkungan server internal.

---

## 4. Spesifikasi Teknologi (Tech Stack)

### Pilihan Pengguna (User Decisions)
- **Framework:** Next.js (App Router) + TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM + Drizzle Kit (untuk migrasi database)
- **Authentication:** NextAuth.js (Credentials Provider untuk login username/email & password)

### Rekomendasi & Pilihan Teknis Tambahan (Builder's Call)
- **Library Export Excel:** `exceljs`
  - *Alasan:* Lebih unggul dibanding `xlsx` standar karena mendukung pengaturan lebar kolom otomatis, border tabel, header tebal, dan pewarnaan sel (misalnya warna merah untuk status OFF dan hijau untuk ON) sehingga file Excel bulanan langsung rapi saat dibuka.
- **Library Export PDF:** `jspdf` + `jspdf-autotable`
  - *Alasan:* Ringan, cepat dalam menghasilkan dokumen tabel rekap laporan resmi siap cetak/unduh tanpa perlu menjalankan headless browser di server.
- **UI & Styling:** Tailwind CSS + komponen UI berbasis Radix/Shadcn UI + Lucide Icons
  - *Alasan:* Tampilan bersih, responsif untuk diakses petugas melalui HP maupun oleh Admin/SPV melalui layar desktop.
- **Validasi Form & Data:** `zod`

---

## 5. Peran Pengguna & Alur Kerja (User Roles & Workflows)

### A. Petugas Lokasi (`ROLE: PETUGAS`)
Satu akun petugas dapat ditugaskan ke **satu atau beberapa lokasi sekaligus** (relasi *Many-to-Many*, misalnya satu petugas memegang `IT Surabaya` dan `LPG Surabaya`).

1. **Halaman Input Laporan Harian (Sekaligus / Batch Input Multi-Lokasi):**
   - Halaman menampilkan tanggal laporan (default: hari ini) dan **langsung menampilkan daftar seluruh lokasi yang dipegang oleh petugas tersebut** dalam satu form terpadu (sehingga petugas tidak perlu mengisi dan menyimpan satu per satu).
   - **Tombol Pintas "Pilih Semua ON":** Disediakan tombol cepat di bagian atas untuk mengatur seluruh lokasi menjadi `ON` sekaligus (mengingat kondisi normal mayoritas lokasi adalah ON), lalu petugas cukup mengubah lokasi tertentu saja jika ada yang berkendala.
   - Pada setiap baris/kartu lokasi (contoh: `IT Surabaya`, `LPG Surabaya`, `BP Gresik`), terdapat:
     - Pilihan status: tombol **ON** (`status = 'ON'`) dan **Ada Kendala / OFF** (`status = 'OFF'`).
     - Jika pada lokasi tersebut dipilih **Ada Kendala / OFF**, muncul kolom **Catatan Kendala** (teks, **opsional**, contoh: "Off 3 titik" atau "Kamera area dermaga mati") khusus untuk lokasi tersebut.
   - **Satu Tombol "Simpan Laporan":** Menyimpan seluruh laporan lokasi yang diisi sekaligus dalam satu kali klik (menggunakan mekanisme *Batch Upsert* ke tabel `daily_reports`).
   - Jika sebagian atau seluruh lokasi sudah pernah dilaporkan pada tanggal tersebut, status yang sudah tersimpan otomatis tampil di baris lokasi masing-masing dan dapat langsung diperbarui.

2. **Halaman Riwayat & Edit Laporan:**
   - Menampilkan daftar laporan yang pernah diinput untuk lokasi-lokasi yang dipegang oleh petugas tersebut (dilengkapi filter lokasi jika petugas memegang lebih dari 1 lokasi, diurutkan dari tanggal terbaru).
   - Petugas dapat menekan tombol **Edit** pada riwayat laporan untuk mengubah status (`ON` / `Ada Kendala / OFF`) maupun catatan kendala jika ada koreksi atau perbaikan.

---

### B. Admin / Supervisor (`ROLE: ADMIN`)
Akun Admin/SPV memiliki akses penuh ke seluruh lokasi.

1. **Dashboard Pemantauan Harian (Real-Time Recap):**
   - Kartu ringkasan untuk tanggal yang dipilih (default: Hari Ini):
     - **Total Lokasi Aktif**
     - **Sudah Lapor - ON** (Hijau)
     - **Sudah Lapor - Ada Kendala / OFF** (Merah/Kuning, beserta catatan kendala jika ada)
     - **Belum Lapor** (Abu-abu, menampilkan daftar lokasi yang belum mengisi laporan hari ini)
   - **Tombol Salin Format WhatsApp:**
     Menghasilkan teks otomatis sesuai format standar WhatsApp untuk tanggal yang dipilih (jika status OFF dan ada catatan, menampilkan catatannya; jika tanpa catatan tertulis "Ada Kendala / Off"):
     ```text
     Laporan Harian CCTV
     Senin, 02 November 2026
     ============================
     AFT Juanda : On semua.
     IT Surabaya : On semua.
     IT Bima : On semua.
     LPG Surabaya : On semua.
     BP Gresik : Off (Catatan bila ada).
     FT Malang : On semua.
     ...
     ```

2. **Halaman Rekapitulasi & Filter Rentang Waktu:**
   - Filter berdasarkan:
     - **Rentang Tanggal:** Tanggal Mulai s/d Tanggal Akhir (atau preset: Hari Ini, Minggu Ini, Bulan Ini / Pilih Bulan & Tahun).
     - **Lokasi:** Semua Lokasi atau pilih lokasi tertentu (misal hanya `IT Bima`).
     - **Status:** Semua, ON Semua, Ada Kendala/OFF, Belum Lapor.
   - Menampilkan tabel rekapitulasi lengkap beserta matriks kepatuhan laporan per tanggal.

3. **Fitur Export Laporan (Excel & PDF):**
   - **Export Excel (.xlsx):** Mengunduh file Excel berisi rekap laporan sesuai rentang tanggal/bulan yang dipilih, lengkap dengan ringkasan per lokasi dan detail harian.
   - **Export PDF (.pdf):** Mengunduh dokumen PDF tabel rekapitulasi siap cetak untuk pelaporan bulanan/mingguan SPV.

4. **Manajemen Master Lokasi & User:**
   - **Master Lokasi:** Tambah, edit, atau nonaktifkan lokasi (contoh kode/tipe: `IT`, `FT`, `AFT`, `LPG`, `BP` beserta nama lokasinya seperti `IT Bima`, `BP Gresik`) dan urutan tampilannya di laporan.
   - **Master User:** Tambah akun petugas atau admin/SPV, atur penempatan lokasi petugas, dan reset password.

---

## 6. Rancangan Skema Database (PostgreSQL & Drizzle ORM)

### 1. Tabel `locations` (Data Master Lokasi)
- `id`: UUID / Serial Primary Key
- `category`: Varchar (contoh: `"IT"`, `"FT"`, `"AFT"`, `"LPG"`, `"BP"`) - Not Null
- `name`: Varchar (hanya nama tempatnya saja, contoh: `"Bima"`, `"Juanda"`, `"Surabaya"`, `"Gresik"`) - Not Null
- `sort_order`: Integer (urutan tampilan pada rekap laporan WhatsApp/Excel)
- `is_active`: Boolean (default `true`)
- `created_at` & `updated_at`: Timestamp
- **Constraint Unik:** `UNIQUE(category, name)` — karena nama tempat yang sama bisa memiliki kategori berbeda (contoh: kategori `"IT"` dengan nama `"Surabaya"` dan kategori `"LPG"` dengan nama `"Surabaya"`).
- **Format Tampilan (Display Name):** Di seluruh tampilan UI dan hasil export digabung menjadi `${category} ${name}` (contoh: `IT Bima`, `IT Surabaya`, `LPG Surabaya`).

### 2. Tabel `users` (Data Pengguna)
- `id`: UUID / Serial Primary Key
- `username`: Varchar - Unique (digunakan untuk login)
- `name`: Varchar (nama petugas / SPV)
- `password_hash`: Text (enkripsi bcrypt)
- `role`: Enum (`'ADMIN'`, `'PETUGAS'`)
- `is_active`: Boolean (default `true`)
- `created_at` & `updated_at`: Timestamp

### 3. Tabel `user_locations` (Tabel Penghubung Petugas & Lokasi / Many-to-Many)
- `id`: UUID / Serial Primary Key
- `user_id`: Foreign Key ke `users.id` (On Delete Cascade)
- `location_id`: Foreign Key ke `locations.id` (On Delete Cascade)
- `created_at`: Timestamp
- **Constraint Unik:** `UNIQUE(user_id, location_id)` — memungkinkan 1 petugas memegang beberapa lokasi sekaligus, dan 1 lokasi dapat ditugaskan ke lebih dari 1 petugas.

### 4. Tabel `daily_reports` (Data Laporan Harian CCTV)
- `id`: UUID / Serial Primary Key
- `location_id`: Foreign Key ke `locations.id` (Not Null)
- `report_date`: Date (`YYYY-MM-DD`, Not Null)
- `status`: Enum (`'ON'`, `'OFF'`)
- `notes`: Text (Nullable / **Opsional** — catatan kendala saat memilih Ada Kendala / OFF)
- `reported_by`: Foreign Key ke `users.id` (user yang pertama kali menginput)
- `updated_by`: Foreign Key ke `users.id` (user yang terakhir mengedit laporan)
- `created_at`: Timestamp (waktu pertama kali lapor)
- `updated_at`: Timestamp (waktu terakhir diedit)
- **Constraint Unik:** `UNIQUE(location_id, report_date)` — memastikan setiap lokasi memiliki tepat 1 record laporan utama per tanggal kalender (WIB/lokal), sehingga tidak terjadi duplikasi laporan di hari yang sama.

---

## 7. Keputusan Teknis Default (Builder's Calls)
Bagian berikut ditetapkan sebagai default oleh pengembang agar sistem langsung siap direncanakan (dapat diubah jika Anda menginginkan aturan berbeda):
1. **Satu Laporan Per Hari Per Lokasi:** Laporan dihitung per tanggal kalender (`report_date`). Jika di hari yang sama ada petugas shift berikutnya di lokasi yang sama, mereka melihat dan memperbarui (edit) status laporan hari tersebut.
2. **Aturan Edit Riwayat Petugas:** Petugas dapat mengedit riwayat laporan lokasi mereka sendiri kapan saja, dan sistem akan mencatat waktu perubahan terakhir pada kolom `updated_at`. Admin/SPV juga dapat membantu menginput atau mengedit laporan lokasi mana pun jika diperlukan.
3. **Data Awal (Database Seeding):** Sistem akan dilengkapi script *seeder* yang langsung membuatkan akun Admin, akun contoh Petugas, serta daftar lokasi sesuai contoh Anda (`AFT Juanda`, `IT Surabaya`, `IT Bima`, `LPG Surabaya`, `BP Gresik`, `FT Malang`, `FT Madiun`, `FT Tuban`, `FT Camplong`, `FT Bandaran`).
