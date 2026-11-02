import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type UserRole = "ADMIN" | "PETUGAS";

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export class AuthorizationError extends Error {
  constructor(message = "Akses ditolak") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertAdmin(user: SessionUser | null | undefined): asserts user is SessionUser {
  if (!user || user.role !== "ADMIN") {
    throw new AuthorizationError("Hanya Admin/SPV yang memiliki akses ke fitur ini");
  }
}

export function assertCanAccessLocations(
  user: SessionUser | null | undefined,
  requestedLocationIds: string[],
  assignedLocationIds: string[]
): void {
  if (!user) {
    throw new AuthorizationError("Sesi login tidak ditemukan");
  }
  if (user.role === "ADMIN") {
    return;
  }

  const assignedSet = new Set(assignedLocationIds);
  for (const locId of requestedLocationIds) {
    if (!assignedSet.has(locId)) {
      throw new AuthorizationError("Anda tidak memiliki akses ke lokasi tersebut");
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!username || !password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.email ?? "";
        token.role = (user as unknown as { role: UserRole }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as SessionUser).id = String(token.id ?? "");
        (session.user as unknown as SessionUser).username = String(
          token.username ?? ""
        );
        (session.user as unknown as SessionUser).role =
          (token.role as UserRole) ?? "PETUGAS";
      }
      return session;
    },
  },
});

export async function requireSessionUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  if (!user?.id) {
    throw new AuthorizationError("Silakan login terlebih dahulu");
  }
  return user;
}
