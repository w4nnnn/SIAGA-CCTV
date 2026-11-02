"use server";

import { assertAdmin, requireSessionUser } from "@/lib/auth";
import {
  createUserWithLocations,
  updateUserLocations,
} from "@/server/services/user.service";

export async function createUserAction(input: {
  username: string;
  name: string;
  password: string;
  role: "ADMIN" | "PETUGAS";
  locationIds: string[];
}) {
  const user = await requireSessionUser();
  assertAdmin(user);
  return createUserWithLocations(input);
}

export async function updateUserLocationsAction(
  userId: string,
  locationIds: string[]
) {
  const user = await requireSessionUser();
  assertAdmin(user);
  return updateUserLocations(userId, locationIds);
}
