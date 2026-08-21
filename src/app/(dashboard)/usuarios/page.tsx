import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUser } from "./actions";
import { UserRow } from "./UserRow";

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    where: { householdId: session.user.householdId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Usuários
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Quem tem acesso ao Casulo.
        </p>
      </div>

      <form
        action={createUser}
        className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex sm:flex-wrap sm:items-end dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="col-span-2 sm:min-w-[140px] sm:flex-1">
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nome
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="col-span-2 sm:min-w-[160px] sm:flex-1">
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="col-span-2 sm:min-w-[160px] sm:flex-1">
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <button
          type="submit"
          className="col-span-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 sm:col-auto"
        >
          Adicionar
        </button>
      </form>

      <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {users.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === session.user.id} />
        ))}
      </div>
    </div>
  );
}
