import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { logoutAction } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-svh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-display text-lg font-black uppercase tracking-tight text-cream">
            Recensioni <span className="text-copper">Smart</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {isAdminEmail(user.email) && (
              <Link href="/dashboard/admin" className="text-muted hover:text-cream">
                Admin
              </Link>
            )}
            <span className="hidden text-muted sm:inline">{user.name}</span>
            <form action={logoutAction}>
              <button type="submit" className="text-muted hover:text-cream">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
