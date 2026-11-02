import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // Abaikan jika .env tidak ada
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  throw new Error(
    "DATABASE_URL tidak ditemukan. Pastikan file .env sudah dibuat dan berisi DATABASE_URL yang valid."
  );
}

export const pool = new Pool({
  connectionString:
    connectionString || "postgresql://dummy:dummy@localhost:5432/dummy",
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
