import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-gradient-to-r from-indigo-950 via-violet-900 to-blue-950">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="sm:hidden">
            <MobileNav userName={session.user.name} isAdmin={session.user.isAdmin} />
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="text-sm font-medium text-indigo-100">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        </div>
        <div className="hidden border-t border-white/10 sm:block">
          <div className="mx-auto w-full max-w-5xl overflow-x-auto px-4 sm:px-6">
            <NavLinks isAdmin={session.user.isAdmin} />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <InstallPrompt />
        {children}
      </main>
    </div>
  );
}
