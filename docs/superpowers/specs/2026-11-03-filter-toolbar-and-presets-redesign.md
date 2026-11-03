# Spesifikasi Desain: Redesain Filter Toolbar & Peningkatan Preset Rekap

**Tanggal:** 3 November 2026  
**Status:** Draft untuk Persetujuan  
**Tujuan:** Memperbaiki alignment visual dan proporsi tata letak toolbar filter pada halaman Rekap & Export, serta menyempurnakan fungsi dan opsi preset rentang tanggal agar lebih aplikatif dan dinamis.

---

## 1. Masalah yang Diidentifikasi

1. **Ketidaksejajaran Visual (*Alignment*) pada Toolbar Filter:**
   - Kolom tombol *Terapkan Filter* berada di baris grid yang sama dengan 4 input lainnya, namun tidak memiliki elemen label sehingga menggunakan pembungkus `flex items-end`. Ini menyebabkan ruang kosong di atas tombol dan ketidaksejajaran *baseline* vertikal.
   - Perbedaan tinggi elemen: komponen dropdown `SelectTrigger` memiliki styling bawaan `data-[size=default]:h-8` (32px) yang berkonflik dengan kelas `h-9` (36px), sedangkan `Input` dan `Button` berukuran `h-9`.
   - Grid 5 kolom sama rata (`lg:grid-cols-5`, masing-masing 20%) menyebabkan kolom *Status Filter* kekurangan ruang horizontal, sehingga teks opsi `"Semua Status (Normal, Kendala, Pending)"` terpotong (*truncated*) menjadi `"Semua Status (Normal, K..."*. Di sisi lain, tombol *Terapkan Filter* mengambil porsi lebar yang terlalu dominan.

2. **Keterbatasan Fungsi Preset Rentang Tanggal:**
   - Tombol *Bulan Ini* saat ini memiliki style aktif (`bg-primary text-primary-foreground`) yang terpasang permanen secara statis (hardcoded), bahkan ketika user memilih *Hari Ini*, *Minggu Ini*, atau mengganti tanggal secara kustom.
   - Logika perhitungan rentang saat ini:
     - *Bulan Ini* hanya menghitung dari tanggal 1 s/d hari ini (jika tanggal 3, hanya mengambil 3 hari).
     - *Minggu Ini* hanya menghitung dari hari Senin s/d hari ini.
   - Belum tersedia preset yang lazim pada dashboard analitik pengawasan, seperti **7 Hari Terakhir** dan **30 Hari Terakhir** (yang langsung dapat menampilkan 300 data simulasi 1 bulan penuh yang baru saja dibuat).

---

## 2. Solusi Desain & Arsitektur

### 2.1. Perbaikan Alignment & Proporsi Toolbar

1. **Keselarasan Vertikal Elemen:**
   - Setiap kolom filter (termasuk tombol *Terapkan Filter*) memiliki kontainer berstruktur seragam:
     - Header label teks: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
     - Untuk kolom tombol aksi, diberikan `<span className="sr-only">Aksi</span>` atau label transparan dengan tinggi yang sama persis (`h-4`), sehingga seluruh elemen input dan tombol memiliki *baseline* dan *top alignment* yang presisi tanpa pergeseran vertikal.
   - Pastikan seluruh kontrol (`Input`, `SelectTrigger`, `Button`) memiliki tinggi terstandarisasi **36px (`h-9`)**.

2. **Pembagian Grid Proporsional (`lg:grid-cols-12`):**
   - **Periode Mulai:** 2 kolom (`lg:col-span-2`)
   - **Periode Sampai:** 2 kolom (`lg:col-span-2`)
   - **Lokasi Operasional:** 3 kolom (`lg:col-span-3`)
   - **Status Filter:** 3 kolom (`lg:col-span-3`)
   - **Terapkan Filter:** 2 kolom (`lg:col-span-2`)

3. **Penyempurnaan Label Opsi Status:**
   - Menyederhanakan label opsi status agar tidak terpotong dan tetap informatif:
     - `"Semua Status"` (menggantikan `"Semua Status (Normal, Kendala, Pending)"`)
     - `"Hanya Status ON"`
     - `"Hanya Kendala / OFF"`
     - `"Hanya Belum Lapor"`

### 2.2. Peningkatan Fungsi Preset Rentang Tanggal

1. **Daftar Preset Baru yang Aplikatif:**
   - **Hari Ini (`today`):** `today` s/d `today`
   - **7 Hari Terakhir (`7d`):** `shiftDate(today, -6)` s/d `today` (7 hari kalender)
   - **Bulan Ini (`month`):** `YYYY-MM-01` s/d hari terakhir bulan berjalan (`YYYY-MM-30`/`31`)
   - **30 Hari Terakhir (`30d`):** `shiftDate(today, -29)` s/d `today` (30 hari kalender, mencakup seluruh dataset simulasi)

2. **Deteksi Status Aktif Dinamis (*Dynamic Active State*):**
   - Dibuat fungsi helper `detectActivePreset(startDate, endDate, todayStr)` di `src/lib/view-models.ts`.
   - Tombol preset yang sedang cocok dengan rentang tanggal saat ini akan mendapatkan styling aktif (`border-primary bg-primary text-primary-foreground shadow-xs font-semibold`).
   - Tombol lainnya berstatus inaktif (`border-border bg-muted/40 text-foreground hover:bg-muted`).
   - Jika pengguna memasukkan tanggal kustom yang tidak cocok dengan preset apa pun, semua tombol berada pada status inaktif dan tag sinkronisasi menampilkan status *"Rentang Kustom"*.

---

## 3. Rencana Komponen & File yang Disentuh

1. **`src/lib/view-models.ts`:**
   - Memperbarui `getRangePreset` untuk mendukung `"today" | "7d" | "30d" | "month"` (dengan fallback backward-compatible untuk `"week"`).
   - Menambahkan fungsi helper `getLastDayOfMonth(dateStr: string): string`.
   - Menambahkan fungsi helper `detectActivePreset(...)`.
2. **`tests/unit/view-models.test.ts`:**
   - Menambahkan unit test komprehensif untuk preset baru (`7d`, `30d`, `month` akhir bulan) dan deteksi preset aktif.
3. **`src/components/ui/select.tsx`:**
   - Memastikan `SelectTrigger` menghormati kelas `h-9` dari props tanpa tertimpa oleh `data-[size=default]:h-8`.
4. **`src/components/admin/DateRangeRecapView.tsx`:**
   - Mengimplementasikan grid proporsional 12 kolom dan kontainer label seragam.
   - Mengimplementasikan tombol preset baru dengan state aktif dinamis.
   - Memperbarui label dropdown status.

---

## 4. Kriteria Verifikasi

1. **Visual & Layout:**
   - Kotak input tanggal, dropdown select, dan tombol *Terapkan Filter* memiliki tinggi yang sama persis (36px).
   - Garis atas dan garis bawah seluruh elemen sejajar sempurna tanpa celah mengambang.
   - Teks opsi pada dropdown *Status Filter* terbaca jelas tanpa terpotong (*truncated*).
2. **Fungsionalitas Preset:**
   - Mengklik *Hari Ini*, *7 Hari Terakhir*, *Bulan Ini*, atau *30 Hari Terakhir* langsung mengubah tanggal mulai dan sampai secara akurat serta memicu filter.
   - Tombol preset yang aktif menyala biru sesuai rentang yang dipilih.
   - Jika tanggal diubah manual di luar preset, status aktif berpindah ke netral/kustom secara otomatis.
3. **Automated Tests:**
   - Seluruh unit test di `tests/unit/view-models.test.ts` dan seluruh test suite `npm run test` lulus.
   - `npm run typecheck` menghasilkan 0 error.
