"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-indigo-100 transition hover:bg-white/10"
    >
      Sair
    </button>
  );
}
