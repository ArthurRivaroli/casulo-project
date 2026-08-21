import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPE_LABELS } from "@/lib/accountTypes";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";
import { RecurrenceBadge } from "@/components/RecurrenceBadge";
import { ExpenseByCategoryChart } from "./ExpenseByCategoryChart";
import { MonthlyBalanceChart } from "./MonthlyBalanceChart";

const DEFAULT_CATEGORY_COLOR = "#6366f1";
const MONTHS_IN_TREND = 6;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { householdId },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { householdId },
      orderBy: { date: "desc" },
      include: { category: true, account: true },
    }),
  ]);

  const now = new Date();
  const monthTransactions = transactions.filter(
    (t) =>
      t.date.getFullYear() === now.getFullYear() &&
      t.date.getMonth() === now.getMonth(),
  );

  const recentTransactions = transactions.slice(0, 5);

  const expenseByCategory = new Map<
    string,
    { name: string; color: string; value: number }
  >();
  for (const t of monthTransactions) {
    if (t.type !== "EXPENSE") continue;
    const existing = expenseByCategory.get(t.categoryId);
    if (existing) {
      existing.value += t.amount;
    } else {
      expenseByCategory.set(t.categoryId, {
        name: t.category.name,
        color: t.category.color ?? DEFAULT_CATEGORY_COLOR,
        value: t.amount,
      });
    }
  }
  const expenseChartData = Array.from(expenseByCategory.values()).sort(
    (a, b) => b.value - a.value,
  );

  const monthlyBalanceData = Array.from({ length: MONTHS_IN_TREND }, (_, i) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - (MONTHS_IN_TREND - 1 - i),
      1,
    );
    const net = transactions
      .filter(
        (t) =>
          t.date.getFullYear() === monthDate.getFullYear() &&
          t.date.getMonth() === monthDate.getMonth(),
      )
      .reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

    return {
      label: monthDate.toLocaleDateString("pt-PT", { month: "short" }),
      net,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Resumo
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Gastos por categoria
          </h2>
          <ExpenseByCategoryChart data={expenseChartData} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Evolução do saldo
          </h2>
          <MonthlyBalanceChart data={monthlyBalanceData} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Contas
        </h2>
        {accounts.length === 0 ? (
          <EmptyState message="Nenhuma conta cadastrada ainda." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {account.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Transações recentes
        </h2>
        {recentTransactions.length === 0 ? (
          <EmptyState message="Nenhuma transação lançada ainda." />
        ) : (
          <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t.description || t.category.name}
                    </p>
                    <RecurrenceBadge
                      isFixed={t.isFixed}
                      installmentNumber={t.installmentNumber}
                      installmentTotal={t.installmentTotal}
                    />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t.category.name} · {t.account.name} ·{" "}
                    {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={
                    t.type === "INCOME"
                      ? "font-medium text-emerald-600"
                      : "font-medium text-red-600"
                  }
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
      {message}
    </div>
  );
}
