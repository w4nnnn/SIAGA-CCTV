"use server";

import { assertAdmin, requireSessionUser } from "@/lib/auth";
import {
  createLocation,
  listLocations,
  updateLocation,
} from "@/server/services/location.service";

export async function getLocationsAction(activeOnly = false) {
  await requireSessionUser();
  return listLocations({ activeOnly });
}

export async function createLocationAction(input: {
  category: string;
  name: string;
  sortOrder?: number;
}) {
  const user = await requireSessionUser();
  assertAdmin(user);
  return createLocation(input);
}

export async function updateLocationAction(
  id: string,
  input: Partial<{
    category: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const user = await requireSessionUser();
  assertAdmin(user);
  return updateLocation(id, input);
}
