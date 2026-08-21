import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/formatCurrency";
import { shiftMonth } from "@/lib/monthNav";
import { AlertTriangleIcon, CheckCircleIcon } from "@/components/icons";
import { setBudget, copyPreviousMonthBudgets } from "./actions";

function parseMonthYear(searchParams: { month?: string; year?: string }) {
  const now = new Date();
  const month = Number(searchParams.month);
  const year = Number(searchParams.year);

  return {
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1,
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear(),
  };
}

function monthLabel(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });
}

function progressColor(percentage: number) {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

export default async function OrcamentosPage({
  searchParams,
}: PageProps<"/orcamentos">) {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const { month, year } = parseMonthYear(await searchParams);
  const previous = shiftMonth(month, year, -1);
  const next = shiftMonth(month, year, 1);

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const [categories, budgets, spentSums, incomeSum, previousBudgets] = await Promise.all([
    prisma.category.findMany({
      where: { householdId, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({ where: { householdId, month, year } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        householdId,
        type: "EXPENSE",
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        householdId,
        type: "INCOME",
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: { householdId, month: previous.month, year: previous.year },
      select: { categoryId: true },
    }),
  ]);

  const budgetByCategory = new Map(budgets.map((b) => [b.categoryId, b.amount]));
  const spentByCategory = new Map(
    spentSums.map((s) => [s.categoryId, s._sum.amount ?? 0]),
  );

  const currentCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const canCopyPreviousMonth = previousBudgets.some(
    (b) => !currentCategoryIds.has(b.categoryId),
  );

  // "Orçamento total" é a receita lançada no mês — quanto entrou é o teto
  // do que dá pra gastar, não a soma arbitrária dos orçamentos por categoria.
  const totalBudget = incomeSum._sum.amount ?? 0;
  const totalSpent = spentSums.reduce((sum, s) => sum + (s._sum.amount ?? 0), 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : null;

  const overBudgetCategories = categories.filter((category) => {
    const budgetAmount = budgetByCategory.get(category.id);
    const spent = spentByCategory.get(category.id) ?? 0;
    return !!budgetAmount && spent > budgetAmount;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Orçamento
          </h1>
          <p className="mt-1 text-sm capitalize text-zinc-500 dark:text-zinc-400">
            {monthLabel(month, year)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {canCopyPreviousMonth && (
            <form action={copyPreviousMonthBudgets.bind(null, month, year)}>
              <button
                type="submit"
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Copiar orçamento do mês anterior
              </button>
            </form>
          )}
          <Link
            href={`/orcamentos?month=${previous.month}&year=${previous.year}`}
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Anterior
          </Link>
          <Link
            href={`/orcamentos?month=${next.month}&year=${next.year}`}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Próximo →
          </Link>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Orçamento total
                </p>
                <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {totalBudget > 0 ? formatCurrency(totalBudget) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                  Gasto total
                </p>
                <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>

            {totalPercentage !== null && (
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                  totalPercentage >= 100
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : totalPercentage >= 80
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                {totalPercentage >= 80 ? (
                  <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {totalPercentage >= 100
                    ? "Orçamento estourado"
                    : totalPercentage >= 80
                      ? "Perto do limite"
                      : "Dentro do orçamento"}{" "}
                  ({Math.round(totalPercentage)}%)
                </span>
              </div>
            )}
          </div>

          {overBudgetCategories.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0">
                Estourou o orçamento em: {overBudgetCategories.map((c) => c.name).join(", ")}.
              </span>
            </div>
          )}
        </div>
      )}

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Cadastre pelo menos uma categoria de despesa em{" "}
          <Link href="/categorias" className="font-medium text-indigo-600 hover:text-indigo-500">
            Categorias
          </Link>{" "}
          para definir orçamentos.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category) => {
            const budgetAmount = budgetByCategory.get(category.id) ?? null;
            const spent = spentByCategory.get(category.id) ?? 0;
            const percentage = budgetAmount ? Math.min(100, (spent / budgetAmount) * 100) : 0;
            const isOverBudget = !!budgetAmount && spent > budgetAmount;
            const setBudgetForCategory = setBudget.bind(null, category.id, month, year);

            return (
              <div
                key={category.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color ?? "#6366f1" }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {category.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(spent)}
                        {budgetAmount ? ` de ${formatCurrency(budgetAmount)}` : " gastos"}
                        {isOverBudget && (
                          <span className="ml-2 inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                            <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                            Estourado
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <form action={setBudgetForCategory} className="flex shrink-0 items-center gap-2">
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Sem orçamento"
                      defaultValue={budgetAmount ?? ""}
                      className="w-36 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <button
                      type="submit"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Salvar
                    </button>
                  </form>
                </div>
                {budgetAmount && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full ${progressColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
