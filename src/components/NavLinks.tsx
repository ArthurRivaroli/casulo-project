"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Resumo" },
  { href: "/transacoes", label: "Transações" },
  { href: "/contas", label: "Contas" },
  { href: "/categorias", label: "Categorias" },
  { href: "/orcamentos", label: "Orçamento" },
  { href: "/metas", label: "Metas" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-5 py-2.5">
      {LINKS.map((link) => {
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
