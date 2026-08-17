import "server-only";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.toLowerCase());
}

// notFound() rather than a 403 — an admin route shouldn't visibly exist to
// everyone else either.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
