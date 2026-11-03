import bcrypt from "bcryptjs";
import { asc, inArray } from "drizzle-orm";
import { db, pool } from "./index";
import { dailyReports, locations, userLocations, users } from "./schema";
import {
  generateSimulationReports,
  getPast30Days,
  SIMULATION_LOCATIONS,
  SIMULATION_USERS,
} from "./simulation-generator";

export async function runSimulationSeed() {
  return await db.transaction(async (tx) => {
    // 1. Clean wipe: bersihkan data transaksi dan relasi penugasan
    await tx.delete(dailyReports);
    await tx.delete(userLocations);

    // Hapus user simulasi yang lama agar fresh insert
    const simulationUsernames = [
      ...SIMULATION_USERS.map((u) => u.username),
      "petugas_jatim",
    ];
    await tx
      .delete(users)
      .where(inArray(users.username, simulationUsernames));

    // 2. Pastikan 10 master lokasi tersedia
    for (const loc of SIMULATION_LOCATIONS) {
      await tx
        .insert(locations)
        .values(loc)
        .onConflictDoUpdate({
          target: [locations.category, locations.name],
          set: {
            sortOrder: loc.sortOrder,
            isActive: true,
            updatedAt: new Date(),
          },
        });
    }

    const allLocations = await tx
      .select()
      .from(locations)
      .orderBy(asc(locations.sortOrder));

    const locationIndexMap = new Map<number, (typeof allLocations)[0]>();
    SIMULATION_LOCATIONS.forEach((simLoc, idx) => {
      const match = allLocations.find(
        (l) => l.category === simLoc.category && l.name === simLoc.name
      );
      if (!match) {
        throw new Error(`Lokasi ${simLoc.category} ${simLoc.name} tidak ditemukan.`);
      }
      locationIndexMap.set(idx, match);
    });

    // 3. Insert 1 Admin dan 3 Petugas
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const petugasPasswordHash = await bcrypt.hash("petugas123", 10);

    const insertedUsers = await tx
      .insert(users)
      .values(
        SIMULATION_USERS.map((u) => ({
          username: u.username,
          name: u.name,
          passwordHash:
            u.role === "ADMIN" ? adminPasswordHash : petugasPasswordHash,
          role: u.role,
          isActive: true,
        }))
      )
      .returning();

    const userMap = new Map<string, (typeof insertedUsers)[0]>();
    insertedUsers.forEach((u) => userMap.set(u.username, u));

    // 4. Hubungkan userLocations sesuai pembagian rayon
    const userLocationRows: Array<{ userId: string; locationId: string }> = [];
    const locationPetugasMap = new Map<number, string>(); // locationIndex -> petugasId

    for (const userConfig of SIMULATION_USERS) {
      if (userConfig.role !== "PETUGAS") continue;
      const dbUser = userMap.get(userConfig.username);
      if (!dbUser) {
        throw new Error(`User ${userConfig.username} tidak ditemukan.`);
      }

      for (const locIdx of userConfig.assignedLocationIndices) {
        const dbLoc = locationIndexMap.get(locIdx);
        if (!dbLoc) {
          throw new Error(`Lokasi indeks ${locIdx} tidak ditemukan.`);
        }
        userLocationRows.push({
          userId: dbUser.id,
          locationId: dbLoc.id,
        });
        locationPetugasMap.set(locIdx, dbUser.id);
      }
    }

    if (userLocationRows.length > 0) {
      await tx.insert(userLocations).values(userLocationRows);
    }

    // 5. Generate 300 data laporan harian (30 hari x 10 lokasi)
    const dates = getPast30Days();
    const generated = generateSimulationReports(dates);

    let onCount = 0;
    let offCount = 0;

    const reportRows = generated.map((gen) => {
      const dbLoc = locationIndexMap.get(gen.locationIndex)!;
      const petugasId = locationPetugasMap.get(gen.locationIndex)!;

      if (gen.status === "ON") onCount++;
      if (gen.status === "OFF") offCount++;

      return {
        locationId: dbLoc.id,
        reportDate: gen.reportDate,
        status: gen.status,
        notes: gen.notes,
        reportedBy: petugasId,
        updatedBy: petugasId,
      };
    });

    if (reportRows.length > 0) {
      await tx.insert(dailyReports).values(reportRows);
    }

    return {
      locationsCount: allLocations.length,
      usersCount: insertedUsers.length,
      reportsCount: reportRows.length,
      onCount,
      offCount,
      datesRange: {
        from: dates[0],
        to: dates[dates.length - 1],
      },
    };
  });
}

if (require.main === module) {
  runSimulationSeed()
    .then(async (summary) => {
      console.log("==================================================");
      console.log("SEED SIMULASI 1 BULAN BERHASIL DIJALANKAN (Clean Wipe)");
      console.log("==================================================");
      console.log(`- Master Lokasi     : ${summary.locationsCount} lokasi`);
      console.log(`- User Dibuat       : ${summary.usersCount} user (1 Admin, 3 Petugas)`);
      console.log(`- Rentang Tanggal   : ${summary.datesRange.from} s/d ${summary.datesRange.to} (30 hari)`);
      console.log(`- Total Laporan     : ${summary.reportsCount} baris laporan`);
      console.log(`  * Status ON       : ${summary.onCount} (${Math.round((summary.onCount / summary.reportsCount) * 100)}%)`);
      console.log(`  * Status OFF      : ${summary.offCount} (${Math.round((summary.offCount / summary.reportsCount) * 100)}%)`);
      console.log("==================================================");
      console.log("Akun Petugas & Rayon:");
      console.log("1. admin (password: admin123) - Supervisor CCTV");
      console.log("2. petugas_1 (password: petugas123) - Rayon Surabaya (4 Lokasi)");
      console.log("3. petugas_2 (password: petugas123) - Rayon Barat & Selatan (3 Lokasi)");
      console.log("4. petugas_3 (password: petugas123) - Rayon Madura & Kepulauan (3 Lokasi)");
      console.log("==================================================");
      await pool.end();
    })
    .catch(async (err) => {
      console.error("Seed simulasi gagal:", err);
      await pool.end();
      process.exit(1);
    });
}
