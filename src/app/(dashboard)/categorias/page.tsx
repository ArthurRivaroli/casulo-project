import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategory } from "./actions";
import { CategoryRow } from "./CategoryRow";

export default async function CategoriasPage() {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const categories = await prisma.category.findMany({
    where: { householdId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Categorias
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Categorias de receita e despesa da casa.
        </p>
      </div>

      <form
        action={createCategory}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <label
            htmlFor="color"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Cor
          </label>
          <input
            id="color"
            type="color"
            name="color"
            defaultValue="#6366f1"
            className="h-9 w-9 rounded-lg border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        <div className="min-w-[160px] flex-1">
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
            placeholder="Ex: Mercado"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label
            htmlFor="type"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue="EXPENSE"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Adicionar
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Nenhuma categoria cadastrada ainda.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
