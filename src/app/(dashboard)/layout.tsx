import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Logo } from "@/components/Logo";
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
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-auto" />
          </div>
          <NavLinks />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-indigo-100">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
