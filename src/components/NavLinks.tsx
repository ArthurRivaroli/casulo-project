"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/navLinks";

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = NAV_LINKS.filter((link) => !link.adminOnly || isAdmin);

  return (
    <nav className="flex items-center gap-5 py-2.5">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? "shrink-0 whitespace-nowrap text-sm font-bold text-white"
                : "shrink-0 whitespace-nowrap text-sm font-bold text-indigo-200/70 hover:text-indigo-100"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
