import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import { locations, users, userLocations } from "./schema";

export const INITIAL_LOCATIONS = [
  { category: "AFT", name: "Juanda", sortOrder: 1 },
  { category: "IT", name: "Surabaya", sortOrder: 2 },
  { category: "IT", name: "Bima", sortOrder: 3 },
  { category: "LPG", name: "Surabaya", sortOrder: 4 },
  { category: "BP", name: "Gresik", sortOrder: 5 },
  { category: "FT", name: "Malang", sortOrder: 6 },
  { category: "FT", name: "Madiun", sortOrder: 7 },
  { category: "FT", name: "Tuban", sortOrder: 8 },
  { category: "FT", name: "Camplong", sortOrder: 9 },
  { category: "FT", name: "Bandaran", sortOrder: 10 },
];

export async function runSeed() {
  const insertedLocations = await db
    .insert(locations)
    .values(INITIAL_LOCATIONS)
    .onConflictDoNothing()
    .returning();

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const petugasPasswordHash = await bcrypt.hash("petugas123", 10);

  await db
    .insert(users)
    .values({
      username: "admin",
      name: "Supervisor CCTV",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    })
    .onConflictDoNothing();

  const [petugasUser] = await db
    .insert(users)
    .values({
      username: "petugas_jatim",
      name: "Petugas Regional",
      passwordHash: petugasPasswordHash,
      role: "PETUGAS",
    })
    .onConflictDoNothing()
    .returning();

  if (petugasUser && insertedLocations.length > 0) {
    await db
      .insert(userLocations)
      .values(
        insertedLocations.slice(0, 4).map((loc) => ({
          userId: petugasUser.id,
          locationId: loc.id,
        }))
      )
      .onConflictDoNothing();
  }
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      console.log("Database seed berhasil dijalankan.");
      await pool.end();
    })
    .catch(async (err) => {
      console.error("Database seed gagal:", err);
      await pool.end();
      process.exit(1);
    });
}
