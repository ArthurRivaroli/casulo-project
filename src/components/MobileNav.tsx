"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/navLinks";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export function MobileNav({
  userName,
  isAdmin,
}: {
  userName?: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = NAV_LINKS.filter((link) => !link.adminOnly || isAdmin);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-indigo-100 hover:bg-white/10"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-indigo-950 via-violet-900 to-blue-950 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)}>
                <Logo className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-100 hover:bg-white/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-1 flex-col gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={
                      isActive
                        ? "rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white"
                        : "rounded-lg px-3 py-2 text-sm font-bold text-indigo-200/70 hover:bg-white/5 hover:text-indigo-100"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              {userName && (
                <span className="text-sm font-medium text-indigo-100">
                  {userName}
                </span>
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
