"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";

// Casulo é uso restrito (só os moradores da casa) — cadastro público
// desabilitado até as rotas terem proteção/convite. Reative removendo este bloco.
const REGISTRATION_ENABLED = false;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, householdName, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Não foi possível criar a conta.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!REGISTRATION_ENABLED) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-blue-950 px-4 py-16">
        <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />

        <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
          <Logo className="mx-auto h-14 w-auto" />
          <p className="mt-4 text-sm text-indigo-100">
            Cadastro desabilitado no momento.
          </p>
          <p className="mt-1 text-sm text-indigo-200/60">
            O Casulo é de uso restrito. Fale com quem administra a casa para
            receber acesso.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Voltar para o login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-blue-950 px-4 py-16">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-14 w-auto" />
          <p className="mt-3 text-sm text-indigo-200/70">
            Crie sua casa e comece a organizar as finanças.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-indigo-100"
            >
              Seu nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30"
              placeholder="Maria Silva"
            />
          </div>

          <div>
            <label
              htmlFor="householdName"
              className="mb-1.5 block text-sm font-medium text-indigo-100"
            >
              Nome da casa
            </label>
            <input
              id="householdName"
              type="text"
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30"
              placeholder="Casa da Família Silva"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-indigo-100"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-indigo-100"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-indigo-300/40 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/40 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-indigo-200/60">
          Já tem conta?{" "}
          <a
            href="/login"
            className="font-medium text-violet-300 hover:text-violet-200"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
