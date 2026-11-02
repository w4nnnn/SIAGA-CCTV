import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userLocations, users } from "@/db/schema";
import { userInputSchema } from "@/lib/validators";

export async function getUserAssignedLocationIds(
  userId: string
): Promise<string[]> {
  const rows = await db
    .select({ locationId: userLocations.locationId })
    .from(userLocations)
    .where(eq(userLocations.userId, userId));

  return rows.map((r) => r.locationId);
}

export async function createUserWithLocations(input: {
  username: string;
  name: string;
  password: string;
  role: "ADMIN" | "PETUGAS";
  locationIds: string[];
}) {
  const parsed = userInputSchema.parse(input);
  const passwordHash = await bcrypt.hash(parsed.password, 10);

  return db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        username: parsed.username,
        name: parsed.name,
        passwordHash,
        role: parsed.role,
      })
      .returning();

    const uniqueLocationIds = Array.from(new Set(parsed.locationIds));
    if (uniqueLocationIds.length > 0) {
      await tx.insert(userLocations).values(
        uniqueLocationIds.map((locationId) => ({
          userId: createdUser.id,
          locationId,
        }))
      );
    }

    return {
      id: createdUser.id,
      username: createdUser.username,
      name: createdUser.name,
      role: createdUser.role,
      locationIds: uniqueLocationIds,
    };
  });
}

export async function updateUserLocations(
  userId: string,
  locationIds: string[]
) {
  const uniqueLocationIds = Array.from(new Set(locationIds));

  await db.transaction(async (tx) => {
    await tx.delete(userLocations).where(eq(userLocations.userId, userId));
    if (uniqueLocationIds.length > 0) {
      await tx.insert(userLocations).values(
        uniqueLocationIds.map((locationId) => ({
          userId,
          locationId,
        }))
      );
    }
  });

  return uniqueLocationIds;
}
