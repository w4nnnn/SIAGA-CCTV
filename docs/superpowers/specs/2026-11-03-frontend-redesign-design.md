# Perombakan Total Frontend SIAGA-CCTV — Design

Tanggal: 2026-11-03
Status: menunggu persetujuan

## Tujuan dan alasan

Frontend sekarang memakai navbar atas dengan tema Emerald/Slate dan font Fira. Referensi desain baru
(`docs/reference/`) memakai gaya "Modern Industrial Enterprise": sidebar kiri, top bar, navy `#003366`,
Plus Jakarta Sans + Inter, border 1px, radius kecil. Tujuannya mengganti seluruh tampilan agar sesuai
referensi, dengan komponen shadcn/ui, dan dengan mode terang + gelap.

Sumber referensi: `docs/reference/siaga_cctv_design_system/DESIGN.md` (token, tipografi, komponen) dan
lima mockup `docs/reference/{dashboard_harian,input_laporan,riwayat_edit,rekap_export,master_data}/`
(`code.html` + `screen.png`).

## Goals

- Semua halaman tampil sesuai mockup: login, Dashboard Harian, Input Laporan, Riwayat & Edit,
  Rekap & Export, Master Data.
- App shell baru: sidebar shadcn (desktop) yang menjadi drawer di mobile, plus top bar.
- Light dan dark mode, mengikuti sistem secara default, dengan toggle manual yang tersimpan.
- Seluruh UI memakai komponen shadcn/ui (style `base-nova`, berbasis `@base-ui`).
- Sintaks library dicek ke Context7 sebelum dipakai.

## Non-goals

- Tidak mengubah database, skema Drizzle, migrasi, service di `src/server/services/`, server actions,
  route API export, maupun auth. Backend versi lama tetap dipakai apa adanya.
- Tidak menambah fitur yang butuh data baru (lihat daftar elemen yang dibuang).

## Anti-goals

- Tampilan mirip mockup tetapi menampilkan angka palsu atau hardcode dari mockup.
- Meng-copy HTML mockup ke JSX tanpa komponen shadcn.
- Dark mode yang kontrasnya buruk karena mockup hanya mendefinisikan light mode.

## Keputusan dari pengguna

- Pendekatan B: bangun ulang app shell dan halaman, pertahankan logika dan backend.
- NIK dan durasi perbaikan tidak dipakai.
- Tambahkan light dan dark mode.
- Database dan API tetap versi lama; tampilan yang menyesuaikan.

## Approaches yang dipertimbangkan

- A. Restyle bertahap komponen lama. Risiko kecil, tetapi hasilnya setengah jadi karena komponen lama
  dirancang untuk navbar atas.
- B. Bangun ulang shell dan halaman, logika dipertahankan. **Dipilih pengguna.**
- C. Port HTML mockup apa adanya. Cepat mirip gambar, tetapi tidak memakai shadcn.

## Elemen mockup yang dibuang (tidak ada datanya di backend)

Shift 1/2 dan jam shift, lonceng notifikasi, NIK, durasi perbaikan, drag-and-drop urutan, kolom
"terakhir diedit oleh", tren "vs bulan lalu", donut chart komposisi, jumlah titik kamera/sensor,
kartu "Integritas Data / Mode Penyimpanan / SOP Pertamina", badge "v2.4.0", "LIVE TELEMETRY"/
"Sinkronisasi Realtime", tombol "Pratinjau Cetak Web", "Tindak Lanjut", "Matriks Penugasan" sebagai tab
terpisah, ID petugas (#HW-9942).

## Rancangan

### Tema dan token

- `globals.css` memakai token DESIGN.md: navy `#003366` sebagai `--primary` (light), nilai aksen terang
  untuk dark (`inverse-primary` `#a7c8ff` sebagai dasar). Token tambahan: `--status-on`, `--status-off`,
  `--status-warning`, `--status-pending` (masing-masing base/surface/border) untuk light dan dark, plus
  token sidebar shadcn.
- Radius dasar 4px (`--radius: 0.25rem`), kartu/tabel 8px. Badge status berbentuk persegi 4px dengan
  border, bukan pill.
- Font lewat `next/font/google`: Plus Jakarta Sans (heading, angka KPI) dan Inter (body, tabel);
  angka memakai `tabular-nums`. Link Google Fonts manual di `layout.tsx` dihapus.
- Dark mode: `next-themes` (`attribute="class"`, `defaultTheme="system"`), menggantikan
  `ThemeToggle.tsx` dan skrip `themeInitScript` yang sekarang. Toggle baru berbasis `Button` +
  `DropdownMenu` (Terang/Gelap/Sistem) di top bar.

### App shell

- Route group `src/app/(app)/` dengan `layout.tsx` yang memuat `auth()`, redirect ke `/login` bila belum
  login, lalu merender `SidebarProvider` + `AppSidebar` + `SidebarInset` + `TopBar`. URL halaman tidak
  berubah (`/admin`, `/admin/rekap`, `/admin/master`, `/petugas`, `/petugas/riwayat`). Pengecekan role
  ADMIN tetap di tiap page seperti sekarang.
- `AppSidebar`: logo + "SIAGA-CCTV", menu menurut role (ADMIN: Dashboard Harian, Input Laporan, Riwayat &
  Edit, Rekap & Export, Master Data; PETUGAS: Input Laporan, Riwayat & Edit), menu aktif berdasarkan
  pathname, footer berisi nama + role user dan tombol keluar. Pada mobile menjadi drawer shadcn.
- `TopBar`: `SidebarTrigger`, tanggal hari ini (Asia/Jakarta, format Indonesia), toggle tema,
  avatar inisial + nama + role, tombol keluar.
- `getNavigationItemsForRole` di `ui-state.ts` diperbarui (ADMIN mendapat "Riwayat & Edit"; label
  mengikuti mockup) dan tesnya disesuaikan.

### Halaman

1. Login: kartu terpusat gaya baru, form `Input`/`Label`/`Button`, logika login tidak berubah.
2. Dashboard Harian (`/admin`): navigator tanggal (prev/next/`Hari Ini`, lewat `?date=`), tombol Salin
   Format WhatsApp di header (tetap tanpa panel pratinjau), filter kategori (Semua + kategori dari data),
   4 KPI card dengan border atas berwarna (Total Lokasi, Sudah Lapor ON, Ada Kendala, Belum Lapor), blok
   "Peringatan Kendala Harian" berisi kartu per lokasi OFF dengan catatannya, tabel pemantauan dengan
   pencarian (kolom: lokasi, kategori, status, jam lapor, catatan), dan kartu distribusi berupa bar
   bertumpuk ON/OFF/Belum + legenda + persentase operasional. Semua dari `getDailyMonitoringSummary`.
   Catatan: nama pelapor dan jam lapor tidak ada di summary saat ini (hanya `notes`); jam lapor
   diambil bila `updatedAt` tersedia, kolom pelapor dibuang jika tidak ada.
3. Input Laporan (`/petugas`): kartu hero navy (judul, nama petugas, daftar lokasi tugas), callout
   panduan, bar aksi global (tanggal, "Pilih Semua ON", "Tandai Semua Kendala"), baris lokasi berupa kartu
   dengan chip kategori, segmented toggle ON / Ada Kendala, input catatan yang muncul inline saat OFF,
   sticky bottom bar (ringkasan jumlah ON/OFF, Reset Form, Simpan Semua Laporan). `AlertDialog`
   konfirmasi sebelum simpan dipertahankan. Layout kartu di mobile, grid horizontal di desktop. Logika dari
   `ui-state.ts` dan `submitBatchDailyReportsAction` dipakai ulang.
4. Riwayat & Edit (`/petugas/riwayat`): 3 KPI (Total Log, Normal, Kendala), filter lokasi + rentang
   tanggal (server-side lewat `searchParams` ke `getOperatorReportHistory`) + status (client-side), tabel
   (tanggal, lokasi, status, catatan, jam lapor), pagination client-side, dialog edit (metadata read-only,
   radio ON/OFF, textarea catatan wajib saat OFF, Batal/Simpan) memakai `updateHistoricalReportAction`.
5. Rekap & Export (`/admin/rekap`): preset (Hari Ini, Minggu Ini, Bulan Ini) + input tanggal mulai/sampai,
   filter kategori/lokasi dan status, tombol Export Excel dan PDF (URL dari `buildExportDownloadUrl`), 3 KPI
   turunan dari data (Kepatuhan Lapor, Hari Bebas Kendala, Insiden Kendala = jumlah lokasi-hari OFF),
   matriks keaktifan per lokasi x tanggal (badge ON/OFF/-, persentase keaktifan; ditampilkan bila rentang
   <= 31 hari, selain itu diganti catatan agar tidak terlalu lebar), dan tabel detail audit (no, lokasi,
   kategori, hari ON, hari OFF, keaktifan %, catatan kendala terakhir).
6. Master Data (`/admin/master`): 3 KPI (total lokasi, total akun, cakupan penugasan), `Tabs` Lokasi dan
   Akun, tabel dengan pencarian + filter kategori + filter status, dialog Tambah Lokasi dan Tambah Pengguna
   dengan `AlertDialog` konfirmasi (perilaku sekarang dipertahankan), edit penugasan lokasi user,
   toggle aktif/nonaktif lokasi lewat `Switch` memakai `updateLocationAction`. Urutan tampil memakai
   `sortOrder` yang ada; ikon drag dibuang.

### Komponen shadcn yang ditambahkan

`sidebar`, `sheet`, `tooltip`, `separator`, `skeleton`, `avatar`, `tabs`, `switch`, `dropdown-menu`,
`progress`, `pagination` (bila CLI menyediakannya untuk `base-nova`), `scroll-area` bila perlu. Komponen
yang sudah ada (button, card, dialog, alert-dialog, table, select, badge, input, textarea, label)
disesuaikan ke token baru. Dependensi baru: `next-themes`.

### Pembersihan

Hapus `AppNavbar.tsx`, `ThemeToggle.tsx` lama, skrip tema di `layout.tsx`, dan `resolveInitialTheme`
beserta tesnya bila tidak lagi dipakai. Komponen halaman lama diganti, bukan dipertahankan berdampingan.

## Verifikasi

`npm run typecheck`, `npm run test`, `npm run build` harus lulus. Tes baru untuk fungsi murni turunan
(KPI rekap, persentase, pagination, filter) di `tests/unit/`. Pemeriksaan visual tiap halaman di light
dan dark, desktop (>=1280) dan mobile (<768), dibandingkan dengan `screen.png` masing-masing.

## Keputusan saya (bukan dari pengguna; mohon dicek)

- Bar bertumpuk untuk distribusi, bukan donut (tanpa library chart).
- Tab "Matriks Penugasan" digabung ke tab Akun; penugasan diedit dari sana.
- Admin mendapat menu Riwayat & Edit karena service sudah mendukung role ADMIN.
- Filter riwayat server-side untuk lokasi/tanggal, client-side untuk status.
- Kartu hero Input Laporan menampilkan nama + daftar lokasi tugas saja (tanpa ID/NIK).

## Diserahkan ke builder

Pembagian file/komponen, nama komponen turunan, skala spasi detail, urutan pengerjaan per halaman,
detail pewarnaan dark mode di luar token yang disebut, serta bentuk loading/empty state.

## Keputusan tambahan setelah builder check (keputusan saya, sesuai arahan "backend tetap versi lama")

- Service tidak diubah sama sekali. Kolom "jam lapor" dan "pelapor" dihapus dari Dashboard dan Rekap karena
  datanya tidak dikirim service. Riwayat memakai `updatedAt` berlabel "Terakhir diperbarui".
- Rekap: tidak ada filter kategori (export tidak mendukungnya, agar layar dan file unduhan selalu sama).
  Filter lokasi dan status tetap, dikirim ke server seperti sekarang. KPI dan matriks dihitung dari
  `dailyRows`/`locationSummaries` yang dikembalikan service.
- Rumus KPI Rekap: Kepatuhan Lapor = (hari ON + OFF) / (jumlah lokasi x jumlah hari); Hari Bebas Kendala =
  jumlah tanggal yang minimal punya satu laporan ON dan nol OFF dan nol belum lapor; Insiden = jumlah
  lokasi-hari berstatus OFF; Keaktifan % per lokasi = ON / jumlah hari (belum lapor dihitung tidak aktif).
- Master Data: tab Akun hanya tampil + filter + edit penugasan lokasi; toggle aktif hanya untuk lokasi;
  tambah lokasi/pengguna dengan AlertDialog konfirmasi seperti sekarang.
- ADMIN di `/petugas` melihat semua lokasi aktif (perilaku service); kartu hero menampilkan maksimal 4 lokasi
  lalu "+N lainnya".
- Fungsi murni baru `applySelectAllOff` di `ui-state.ts`; aturan catatan wajib untuk OFF mengikuti validator
  yang sudah ada.
- Warna status mode gelap diturunkan sendiri dari token terang (base lebih terang, surface = base 15% di
  atas background).
