import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { formatLocationDisplayName } from "@/lib/format";
import { locationInputSchema } from "@/lib/validators";

export function buildLocationRecord(
  input: {
    category: string;
    name: string;
    sortOrder?: number;
    isActive?: boolean;
  },
  existingLocations: Array<{ id?: string; category: string; name: string }> = []
) {
  const parsed = locationInputSchema.parse(input);
  const normalizedCategory = parsed.category.toUpperCase();
  const normalizedName = parsed.name.trim();

  const duplicate = existingLocations.find(
    (loc) =>
      loc.category.trim().toLowerCase() === normalizedCategory.toLowerCase() &&
      loc.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );

  if (duplicate) {
    throw new Error(
      `Lokasi ${formatLocationDisplayName({ category: normalizedCategory, name: normalizedName })} sudah terdaftar`
    );
  }

  return {
    category: normalizedCategory,
    name: normalizedName,
    sortOrder: parsed.sortOrder,
    isActive: parsed.isActive,
    displayName: formatLocationDisplayName({
      category: normalizedCategory,
      name: normalizedName,
    }),
  };
}

export async function listLocations(options?: { activeOnly?: boolean }) {
  const query = options?.activeOnly
    ? db
        .select()
        .from(locations)
        .where(eq(locations.isActive, true))
        .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name))
    : db
        .select()
        .from(locations)
        .orderBy(asc(locations.sortOrder), asc(locations.category), asc(locations.name));

  const rows = await query;
  return rows.map((row) => ({
    ...row,
    displayName: formatLocationDisplayName(row),
  }));
}

export async function createLocation(input: {
  category: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const existing = await db.select().from(locations);
  const record = buildLocationRecord(input, existing);

  const [created] = await db
    .insert(locations)
    .values({
      category: record.category,
      name: record.name,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
    })
    .returning();

  return {
    ...created,
    displayName: formatLocationDisplayName(created),
  };
}

export async function updateLocation(
  id: string,
  input: Partial<{
    category: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const [updated] = await db
    .update(locations)
    .set({
      ...(input.category !== undefined
        ? { category: input.category.trim().toUpperCase() }
        : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(locations.id, id))
    .returning();

  if (!updated) {
    throw new Error("Lokasi tidak ditemukan");
  }

  return {
    ...updated,
    displayName: formatLocationDisplayName(updated),
  };
}
