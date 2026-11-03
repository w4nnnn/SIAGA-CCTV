# Filter Toolbar & Presets Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki ketidaksejajaran visual (*alignment*), perbedaan tinggi, dan teks terpotong pada toolbar filter halaman Rekap & Export, serta meningkatkan opsi preset menjadi 4 preset terukur (Hari Ini, 7 Hari Terakhir, Bulan Ini, 30 Hari Terakhir) dengan indikator aktif dinamis.

**Architecture:** Memperbarui modul utilitas murni `src/lib/view-models.ts` dengan kalkulasi rentang preset baru (`today`, `7d`, `30d`, `month`) dan fungsi deteksi preset aktif dinamis (`detectActivePreset`). Menerapkan standarisasi tinggi kontrol 36px (`h-9`), pembagian kolom grid proporsional (`lg:grid-cols-12`), dan kontainer label seragam pada `src/components/admin/DateRangeRecapView.tsx`.

**Tech Stack:** React 19, Next.js 16 (App Router), Tailwind CSS v4, Radix/Base UI, Vitest, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-03-filter-toolbar-and-presets-redesign.md`

## Global Constraints

- Standarisasi tinggi seluruh elemen filter (Input tanggal, dropdown select, dan tombol submit) adalah tepat `h-9` (36px).
- Label opsi status tidak boleh mengalami pemotongan teks (*truncation*) di resolusi laptop/desktop standar.
- Style aktif tombol preset harus murni dinamis (tidak ada warna aktif hardcoded).
- Perubahan tidak boleh merusak fungsionalitas ekspor PDF & Excel yang sudah berjalan.

## Review Focus

1. **Akurasi Rentang Tanggal:** Fungsi `getRangePreset` harus menghitung rentang `7d` (7 hari termasuk hari ini), `30d` (30 hari termasuk hari ini), dan `month` (tanggal 1 hingga hari terakhir bulan kalender terkait) secara akurat tanpa pergeseran zona waktu.
2. **Kesesuaian Deteksi Preset:** `detectActivePreset` harus mengembalikan nama preset yang tepat saat rentang cocok, dan `"custom"` saat rentang tanggal tidak cocok dengan preset apa pun.
3. **Keselarasan Vertikal:** Garis atas dan garis bawah seluruh kotak input dan tombol aksi harus sejajar rata (sempurna di sumbu Y).
4. **Kerapian Responsif:** Grid `lg:grid-cols-12` harus tetap tertata rapi saat turun ke breakpoint tablet (`sm:grid-cols-2`) dan mobile (`grid-cols-1`).

---

### Task 1: Logika Preset Rentang Tanggal & Deteksi State Aktif (TDD)

**Files:**
- Modify: `src/lib/view-models.ts`
- Modify: `tests/unit/view-models.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export type RangePresetType = "today" | "7d" | "30d" | "month" | "week";

  export function getLastDayOfMonth(dateStr: string): string;

  export function getRangePreset(
    preset: RangePresetType,
    today: string
  ): { startDate: string; endDate: string };

  export function detectActivePreset(
    startDate: string,
    endDate: string,
    today: string
  ): "today" | "7d" | "30d" | "month" | "custom";
  ```

- [ ] **Step 1: Tulis tes unit untuk preset baru dan deteksi aktif**

Perbarui `tests/unit/view-models.test.ts` untuk menguji:
- `getLastDayOfMonth` untuk bulan 30 hari (November), 31 hari (Oktober, Desember), dan Februari (kabisat/non-kabisat).
- `getRangePreset("today")` menghasilkan `{ startDate: today, endDate: today }`.
- `getRangePreset("7d")` menghasilkan rentang 7 hari (misal `2026-11-03` -> `2026-10-28` s/d `2026-11-03`).
- `getRangePreset("30d")` menghasilkan rentang 30 hari (misal `2026-11-03` -> `2026-10-05` s/d `2026-11-03`).
- `getRangePreset("month")` menghasilkan rentang 1 s/d akhir bulan (misal `2026-11-03` -> `2026-11-01` s/d `2026-11-30`).
- `detectActivePreset` mengembalikan `"today"`, `"7d"`, `"30d"`, `"month"`, atau `"custom"`.

- [ ] **Step 2: Jalankan tes unit untuk memastikan gagal (RED)**

Run: `npx vitest run tests/unit/view-models.test.ts`  
Expected: FAIL pada fungsi dan tipe baru yang belum diimplementasikan.

- [ ] **Step 3: Implementasikan logika di `src/lib/view-models.ts`**

Tambahkan `getLastDayOfMonth`, perbarui `getRangePreset` dengan tipe baru, dan implementasikan `detectActivePreset`.

- [ ] **Step 4: Jalankan tes unit untuk memastikan lulus (GREEN)**

Run: `npx vitest run tests/unit/view-models.test.ts`  
Expected: PASS (seluruh test di `view-models.test.ts` lulus).

- [ ] **Step 5: Commit**

```bash
git add src/lib/view-models.ts tests/unit/view-models.test.ts
git commit -m "feat(recap): add enhanced date range presets and active preset detection"
```

---

### Task 2: Perbaikan Komponen UI, Alignment Grid, dan Toolbar Rekap

**Files:**
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/admin/DateRangeRecapView.tsx`

**Interfaces:**
- Consumes:
  - `getRangePreset`, `detectActivePreset`, `RangePresetType` dari `src/lib/view-models.ts`
  - `SimpleSelect` dari `@/components/common/SimpleSelect`
  - UI components (`Input`, `Button`, `Label`, `Card`)

- [ ] **Step 1: Perbaiki `SelectTrigger` agar ukuran tinggi `h-9` tidak tertimpa**

Di `src/components/ui/select.tsx`, pastikan kelas ukuran tinggi dari `className` tidak kalah dengan `data-[size=default]:h-8`.

- [ ] **Step 2: Perbarui `DateRangeRecapView.tsx`**

1. Tambahkan state reaktif:
   - `const activePreset = useMemo(() => detectActivePreset(startDate, endDate, todayStr), [startDate, endDate, todayStr]);`
2. Render 4 tombol preset:
   - Hari Ini (`handlePreset("today")`)
   - 7 Hari Terakhir (`handlePreset("7d")`)
   - Bulan Ini (`handlePreset("month")`)
   - 30 Hari Terakhir (`handlePreset("30d")`)
   - Setiap tombol memiliki styling dinamis: jika `activePreset === p.id`, gunakan `border-primary bg-primary text-primary-foreground shadow-xs font-semibold`, jika tidak gunakan `border-border bg-muted/40 text-foreground hover:bg-muted`.
3. Sederhanakan teks opsi status dropdown:
   - `"Semua Status"`
   - `"Hanya Status ON"`
   - `"Hanya Kendala / OFF"`
   - `"Hanya Belum Lapor"`
4. Perbarui form filter ke layout grid 12 kolom (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3`):
   - Periode Mulai: `lg:col-span-2`
   - Periode Sampai: `lg:col-span-2`
   - Lokasi Operasional: `lg:col-span-3`
   - Status Filter: `lg:col-span-3`
   - Tombol Terapkan Filter: `lg:col-span-2` dengan header label tersembunyi/invisible setinggi label lainnya (`<Label className="invisible text-xs">Aksi</Label>`) dalam kontainer `space-y-1.5` yang seragam.

- [ ] **Step 3: Uji compile TypeScript & unit test**

Run: `npm run typecheck`  
Run: `npm run test`  
Expected: Exit code 0, semua tes lulus.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/select.tsx src/components/admin/DateRangeRecapView.tsx
git commit -m "refactor(recap): align filter toolbar controls and enhance range preset buttons"
```

---

### Task 3: Verifikasi Komprehensif

**Files:**
- Verified: All affected components and tests

- [ ] **Step 1: Jalankan seluruh suite tes**

Run: `npm run test`  
Run: `npm run typecheck`  
Expected: 100% lulus, 0 type errors.

- [ ] **Step 2: Commit dan Finalisasi**

```bash
git add .
git commit -m "docs(superpowers): update plan and spec for filter toolbar redesign"
```
