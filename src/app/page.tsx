import { redirect } from "next/navigation";
import { auth, SessionUser } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user?.id) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/petugas");
}
