# Docker Build & Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyiapkan konfigurasi kontainerisasi Docker lengkap (Next.js Standalone Multi-stage Dockerfile, .dockerignore, docker-compose.yml, dan helper scripts di package.json) untuk SIAGA-CCTV PT. Merpati Putih Jaya.

**Architecture:** Mengaktifkan mode `output: "standalone"` pada `next.config.mjs` agar build Next.js menghasilkan direktori standalone yang minimal. Membuat multi-stage `Dockerfile` (deps, builder, runner non-root) dan `docker-compose.yml` yang mengorkestrasi service web app bersama database PostgreSQL 18.

**Tech Stack:** Docker, Docker Compose, Next.js 16, Node.js 22/24 Alpine, PostgreSQL 18.

**Spec:** `docs/superpowers/specs/2026-11-03-docker-build-and-compose-design.md`

## Global Constraints

- Standalone output harus aktif di `next.config.mjs`.
- Container runtime Next.js harus dijalankan menggunakan non-root user (`USER nextjs`).
- Port default aplikasi adalah 3000 dan PostgreSQL adalah 5432.
- File rahasia `.env` tidak boleh disalin ke dalam Docker image.
- Perubahan tidak boleh merusak tes unit atau pemeriksaan tipe lokal.

## Review Focus

1. **Efisiensi Multi-Stage Build:** `Dockerfile` harus memisahkan instalasi dependensi, proses build, dan image runner akhir secara bersih.
2. **Kesesuaian .dockerignore:** File lokal (`node_modules`, `.next`, `.git`, `.env*`) tidak boleh masuk ke build context.
3. **Konektivitas Docker Compose:** Service `app` harus dapat berkomunikasi dengan service `postgres` via nama hostname `postgres` pada port 5432 dengan dependency healthcheck.
4. **Validitas Sintaks & Standalone:** `next build` harus menghasilkan folder `.next/standalone`.

---

### Task 1: Konfigurasi Next.js Standalone & Dockerfile

**Files:**
- Modify: `next.config.mjs`
- Create: `.dockerignore`
- Create: `Dockerfile`

- [ ] **Step 1: Aktifkan `output: "standalone"` di `next.config.mjs`**

Tambahkan properti `output: "standalone"` pada konfigurasi `nextConfig`.

- [ ] **Step 2: Buat file `.dockerignore`**

Abaikan:
- `node_modules`
- `.next`
- `.git`
- `.env*` (kecuali `.env.example`)
- `tests`
- `docs`
- `.superpowers`

- [ ] **Step 3: Buat multi-stage `Dockerfile`**

Gunakan base image `node:22-alpine` atau `node:24-alpine`:
- Stage `dependencies`: salin `package*.json`, jalankan `npm ci`.
- Stage `builder`: salin source code, jalankan `npm run build` dengan build-time dummy env.
- Stage `runner`: buat user `nextjs`, salin `.next/standalone`, `.next/static`, dan `public` (jika ada), ekspos port 3000, `CMD ["node", "server.js"]`.

- [ ] **Step 4: Uji build standalone secara lokal**

Run: `npm run build`  
Expected: Direktori `.next/standalone` terbentuk.

- [ ] **Step 5: Commit**

```bash
git add next.config.mjs .dockerignore Dockerfile
git commit -m "feat(docker): add multi-stage standalone Dockerfile and dockerignore"
```

---

### Task 2: Konfigurasi Docker Compose & Helper Scripts

**Files:**
- Create: `docker-compose.yml`
- Modify: `package.json`

- [ ] **Step 1: Buat file `docker-compose.yml`**

Definisikan layanan:
- `postgres` (image: `postgres:18-alpine`, port 5432, volume `postgres_data`, healthcheck `pg_isready`).
- `app` (build: `.`, port 3000, env `DATABASE_URL` mengarah ke host `postgres:5432`, depends_on `postgres` healthy).

- [ ] **Step 2: Tambahkan helper script di `package.json`**

Tambahkan:
```json
"docker:build": "docker build -t siaga-cctv:latest .",
"docker:up": "docker compose up -d",
"docker:down": "docker compose down"
```

- [ ] **Step 3: Validasi konfigurasi Docker Compose**

Run: `docker compose config` (atau verifikasi sintaks YAML).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml package.json
git commit -m "feat(docker): add docker-compose and package scripts"
```

---

### Task 3: Verifikasi Komprehensif

**Files:**
- Verified: Docker image build & project test suite

- [ ] **Step 1: Jalankan tes unit dan typecheck**

Run: `npm run test`  
Run: `npm run typecheck`  
Expected: Seluruh tes lulus (0 error).

- [ ] **Step 2: Jalankan Docker build (bila daemon docker aktif)**

Run: `docker build -t siaga-cctv:latest .`  
Expected: Image berhasil ter-build.

- [ ] **Step 3: Commit dan Finalisasi**

```bash
git add .
git commit -m "docs(superpowers): update spec and plan for docker build and compose"
```
