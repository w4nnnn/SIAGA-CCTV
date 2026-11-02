import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // Abaikan jika .env tidak ada
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL tidak ditemukan. Pastikan file .env sudah dibuat dan berisi DATABASE_URL."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
