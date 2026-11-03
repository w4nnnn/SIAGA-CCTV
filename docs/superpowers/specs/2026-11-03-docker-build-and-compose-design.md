# Spesifikasi Desain: Docker Build & Compose SIAGA-CCTV

**Tanggal:** 3 November 2026  
**Status:** Draft untuk Persetujuan  
**Tujuan:** Menyediakan konfigurasi kontainerisasi siap produksi dan siap pengembangan menggunakan Multi-Stage Dockerfile (Next.js Standalone Mode) serta Docker Compose untuk orkestrasi aplikasi dan database PostgreSQL.

---

## 1. Arsitektur Kontainerisasi

### 1.1. Konfigurasi Next.js Standalone
Pada `next.config.mjs`, ditambahkan opsi:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```
*Manfaat:* Next.js hanya akan memaketkan modul dan dependensi yang benar-benar digunakan ke dalam direktori `.next/standalone`. Ukuran final image terpangkas drastis dari ~1.2 GB menjadi ~150-200 MB.

### 1.2. Multi-Stage Dockerfile
Dockerfile dirancang dengan 3 tahapan (*multi-stage build*):
1. **Stage 1: `dependencies` (Base Image: `node:22-alpine` / `node:24-alpine`)**
   - Menyalin `package.json` dan `package-lock.json`.
   - Menjalankan `npm ci` untuk instalasi dependensi yang deterministik dan terisolasi.
2. **Stage 2: `builder`**
   - Menyalin kode sumber dan `node_modules` dari stage dependencies.
   - Mengatur environment variable build-time (`NEXT_TELEMETRY_DISABLED=1`, dummy `DATABASE_URL` & `AUTH_SECRET` untuk evaluasi server components/actions saat compile).
   - Menjalankan `npm run build`.
3. **Stage 3: `runner` (Production Runtime Minimal)**
   - Menjalankan container dengan non-root user (`nextjs:nodejs`, UID 1001) demi standar keamanan produksi.
   - Menyalin hasil `.next/standalone`, `.next/static`, dan direktori `public` (jika ada).
   - Menjalankan aplikasi secara native dengan `node server.js` pada port `3000`.

### 1.3. `.dockerignore`
Mencegah file lokal yang tidak relevan masuk ke dalam konteks Docker:
- `node_modules`, `.next`, `.git`, `.env*` (kecuali `.env.example`)
- `docs/`, `tests/`, `.superpowers/`, coverage, log files.

---

## 2. Docker Compose (`docker-compose.yml`)

Menyediakan orkestrasi 2 layanan utama yang siap jalan dalam satu perintah:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    container_name: siaga_cctv_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}
      POSTGRES_DB: ${POSTGRES_DB:-siaga_cctv}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-siaga_cctv}"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: siaga_cctv_app
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: "0.0.0.0"
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres123}@postgres:5432/${POSTGRES_DB:-siaga_cctv}
      AUTH_SECRET: ${AUTH_SECRET:-change-this-to-a-very-secure-random-32-chars-secret}
      AUTH_TRUST_HOST: "true"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
    driver: local
```

---

## 3. Fitur Tambahan & Migrasi Database

Untuk kemudahan deployment:
- Disediakan script helper `docker:build` dan `docker:up` di `package.json`.
- Aplikasi dapat langsung berkomunikasi dengan database container `postgres` melalui Docker network internal.
- Menjalankan migrasi atau seed simulasi ke dalam container database dapat dilakukan dengan:
  ```bash
  docker compose exec app npx drizzle-kit migrate
  # atau dari host
  npm run db:migrate
  npm run db:seed:simulasi
  ```

---

## 4. Kriteria Verifikasi

1. Build image Docker `docker build -t siaga-cctv:latest .` berhasil selesai tanpa error.
2. Ukuran image berukuran ringkas (~150-250MB) berkat standalone output.
3. Syntax `docker-compose.yml` tervalidasi (`docker compose config`).
4. `npm run typecheck` dan `npm run test` tetap berjalan bersih 100%.
