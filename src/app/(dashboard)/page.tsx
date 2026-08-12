import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPE_LABELS } from "@/lib/accountTypes";
import { formatCurrency } from "@/lib/formatCurrency";

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

  const income = monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
    0,
  );

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Resumo
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500 dark:text-zinc-400">
          {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Saldo total" value={balance} tone="neutral" />
        <SummaryCard label="Receitas do mês" value={income} tone="positive" />
        <SummaryCard label="Despesas do mês" value={expense} tone="negative" />
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
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {t.description || t.category.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t.category.name} · {t.account.name} ·{" "}
                    {t.date.toLocaleDateString("pt-BR")}
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

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative" | "neutral";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-red-600"
        : "text-zinc-900 dark:text-zinc-50";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>
        {formatCurrency(value)}
      </p>
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
