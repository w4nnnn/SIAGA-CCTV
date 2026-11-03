# Seed Simulasi 1 Bulan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghasilkan skrip seed baru `src/db/seed-simulation.ts` dan generator data `src/db/simulation-generator.ts` untuk mensimulasikan data pemantauan CCTV 30 hari penuh (10 lokasi x 30 hari = 300 laporan) dengan 1 Admin dan 3 Petugas, rasio realistis (~88% ON, ~12% OFF ber-catatan kendala), menggunakan pendekatan Clean Wipe di PostgreSQL.

**Architecture:** Memisahkan logika murni pembuatan dataset simulasi (rentang tanggal, distribusi status, generator catatan kendala, pemetaan 10 lokasi ke 3 rayon petugas) ke dalam modul generator yang dapat diuji secara unit test (TDD). Skrip runner database mengeksekusi transaksi Drizzle ORM untuk clean wipe tabel transaksi (`daily_reports`, `user_locations`), menginisialisasi user/lokasi, dan meng-insert 300 laporan secara batch.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL (node-postgres), Vitest, bcryptjs.

**Spec:** `docs/superpowers/specs/2026-11-03-seed-simulation-1-month-design.md`

## Global Constraints

- File seed baru tidak boleh mengubah atau merusak file seed bawaan `src/db/seed.ts`.
- Skrip dijalankan via `npm run db:seed:simulasi` dengan flag `--env-file=.env`.
- Semua 10 lokasi master harus memiliki laporan setiap hari selama rentang 30 hari (tanpa ada status unreported/bolong).
- Seluruh laporan yang berstatus `OFF` wajib memiliki catatan kendala non-empty (`notes`).
- Status `ON` mayoritas memiliki `notes = null`.
- Pembagian rayon: Petugas 1 (4 lokasi), Petugas 2 (3 lokasi), Petugas 3 (3 lokasi).
- Semua operasi database dilakukan di dalam satu transaksi Drizzle (`db.transaction()`).

## Review Focus

1. **Konsistensi Rentang Tanggal:** Fungsi generator tanggal harus menghasilkan tepat 30 tanggal unik terurut dari `T - 29` hingga `T` (format `YYYY-MM-DD`).
2. **Kesesuaian Pelapor:** Setiap laporan harian harus memiliki `reportedBy` dan `updatedBy` yang sesuai dengan `userId` dari petugas yang memegang lokasi tersebut (bukan id sembarang).
3. **Validitas Status & Catatan:** Setiap baris laporan hanya memiliki status `'ON'` atau `'OFF'`; jika status `'OFF'`, catatan tidak boleh kosong/null.
4. **Kelengkapan Lokasi:** Tidak ada lokasi master yang terlewat dalam 30 hari (tepat 10 lokasi x 30 hari = 300 record).
5. **Idempotensi Clean Wipe:** Jika skrip dijalankan ulang beberapa kali, hasil akhir di database selalu bersih tepat 300 baris laporan untuk 30 hari terakhir.

---

### Task 1: Logika Pembuatan Data Simulasi (Simulation Generator) dengan TDD

**Files:**
- Create: `src/db/simulation-generator.ts`
- Test: `tests/unit/simulation-generator.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface SimulationLocationConfig {
    category: string;
    name: string;
    sortOrder: number;
  }

  export interface SimulationUserConfig {
    username: string;
    name: string;
    role: "ADMIN" | "PETUGAS";
    assignedLocationIndices: number[]; // indeks ke SIMULATION_LOCATIONS (0-based)
  }

  export interface GeneratedDailyReport {
    locationIndex: number;
    reportDate: string; // YYYY-MM-DD
    status: "ON" | "OFF";
    notes: string | null;
  }

  export const SIMULATION_LOCATIONS: SimulationLocationConfig[];
  export const SIMULATION_USERS: SimulationUserConfig[];
  export const REALISTIC_OFF_NOTES: string[];

  export function getPast30Days(referenceDate?: Date): string[];
  export function generateSimulationReports(dates: string[]): GeneratedDailyReport[];
  ```

- [ ] **Step 1: Tulis tes unit untuk generator simulasi**

Buat file `tests/unit/simulation-generator.test.ts` yang menguji:
- `getPast30Days` mengembalikan 30 tanggal dengan format `YYYY-MM-DD`.
- `generateSimulationReports` menghasilkan tepat 300 laporan untuk 30 hari x 10 lokasi.
- Setiap tanggal mencakup seluruh 10 lokasi (tidak ada hari bolong).
- Sekitar 10% s.d. 15% berstatus `OFF`, dan semua yang `OFF` memiliki `notes` dari daftar kendala realistis.
- Yang berstatus `ON` memiliki `notes === null`.
- Pembagian 10 lokasi ke 3 petugas mencakup 10 lokasi tanpa tumpang tindih.

- [ ] **Step 2: Jalankan tes unit untuk memastikan gagal (RED)**

Run: `npx vitest run tests/unit/simulation-generator.test.ts`  
Expected: FAIL dengan error "Cannot find module '../../src/db/simulation-generator'"

- [ ] **Step 3: Implementasikan generator simulasi**

Buat file `src/db/simulation-generator.ts` berisi konfigurasi master lokasi, pembagian 3 rayon petugas, fungsi `getPast30Days`, generator seed pseudo-deterministik untuk status ON/OFF (~88% ON, ~12% OFF), dan seleksi catatan kendala realistis saat OFF.

- [ ] **Step 4: Jalankan tes unit untuk memastikan lulus (GREEN)**

Run: `npx vitest run tests/unit/simulation-generator.test.ts`  
Expected: PASS (seluruh assertion terpenuhi)

- [ ] **Step 5: Commit**

```bash
git add src/db/simulation-generator.ts tests/unit/simulation-generator.test.ts
git commit -m "feat(seed): add simulation data generator with unit tests"
```

---

### Task 2: Implementasi Skrip Runner Database Clean Wipe & NPM Script

**Files:**
- Create: `src/db/seed-simulation.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes:
  - `SIMULATION_LOCATIONS`, `SIMULATION_USERS`, `getPast30Days`, `generateSimulationReports` dari `src/db/simulation-generator.ts`
  - `db`, `pool` dari `src/db/index.ts`
  - `locations`, `users`, `userLocations`, `dailyReports` dari `src/db/schema.ts`
- Produces:
  - `export async function runSimulationSeed(): Promise<{ locationsCount: number; usersCount: number; reportsCount: number; onCount: number; offCount: number }>`
  - Skrip eksekusi CLI mandiri ketika dipanggil lewat `node`/`tsx`.

- [ ] **Step 1: Buat skrip runner `src/db/seed-simulation.ts`**

Implementasikan logika:
1. Membuka `db.transaction(async (tx) => { ... })`.
2. Clean wipe:
   - `await tx.delete(dailyReports);`
   - `await tx.delete(userLocations);`
   - Hapus user simulasi yang relevan (`admin`, `petugas_1`, `petugas_2`, `petugas_3`).
3. Upsert atau insert 10 lokasi master (`locations`), simpan map ID-nya.
4. Insert 1 Admin dan 3 Petugas dengan bcrypt password (`admin123` & `petugas123`), simpan map ID-nya.
5. Insert penugasan `userLocations` sesuai mapping rayon per petugas.
6. Generate 300 data laporan harian menggunakan `generateSimulationReports(getPast30Days())`, petakan `reportedBy` dan `updatedBy` ke ID petugas rayon yang bersangkutan.
7. Batch insert data ke `dailyReports`.
8. Logging ringkasan eksekusi yang rapi dan informatif ke console.
9. Menutup koneksi database pool jika dipanggil langsung (`require.main === module`).

- [ ] **Step 2: Tambahkan skrip `"db:seed:simulasi"` ke `package.json`**

Tambahkan baris berikut di objek `scripts` pada `package.json`:
```json
"db:seed:simulasi": "tsx --env-file=.env src/db/seed-simulation.ts"
```

- [ ] **Step 3: Uji compile TypeScript**

Run: `npm run typecheck`  
Expected: Exit code 0 tanpa error tipe.

- [ ] **Step 4: Commit**

```bash
git add src/db/seed-simulation.ts package.json
git commit -m "feat(seed): add clean wipe simulation database seeder script"
```

---

### Task 3: Eksekusi Seed Simulasi & Verifikasi Menyeluruh

**Files:**
- Verified: Database PostgreSQL (`daily_reports`, `user_locations`, `users`, `locations`)
- Test Suite: All unit & type checks

- [ ] **Step 1: Jalankan skrip seed simulasi**

Run: `npm run db:seed:simulasi`  
Expected: Output console mengonfirmasi clean wipe selesai, 4 user disiapkan, 10 penugasan lokasi dibuat, dan tepat 300 data laporan (30 hari x 10 lokasi) berhasil di-insert dengan ringkasan jumlah ON dan OFF.

- [ ] **Step 2: Jalankan seluruh test suite dan typecheck**

Run: `npm run test`  
Run: `npm run typecheck`  
Expected: Seluruh unit test lulus dan typecheck bersih (0 error).

- [ ] **Step 3: Jalankan verifikasi query database (sanity check)**

Jalankan script ringkas atau query via tsx untuk memverifikasi:
- Count `daily_reports` = 300
- Count distinct `report_date` = 30
- Count `status = 'OFF'` > 0 dan semuanya memiliki `notes != null`
- Count `user_locations` = 10
- Seluruh 10 lokasi memiliki 30 baris laporan tanpa bolong.

- [ ] **Step 4: Commit dan Finalisasi**

```bash
git add .
git commit -m "chore(seed): verify 30-day simulation seed execution"
```
