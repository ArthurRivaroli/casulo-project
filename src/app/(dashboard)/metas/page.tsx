import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoal } from "./actions";
import { GoalRow } from "./GoalRow";

export default async function MetasPage() {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const goals = await prisma.goal.findMany({
    where: { householdId },
    orderBy: { deadline: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Metas
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Metas de economia da casa.
        </p>
      </div>

      <form
        action={createGoal}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
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
            placeholder="Ex: Viagem de férias"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label
            htmlFor="targetAmount"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Meta
          </label>
          <input
            id="targetAmount"
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <label
            htmlFor="deadline"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Prazo
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Adicionar
        </button>
      </form>

      {goals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Nenhuma meta cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
