import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransaction } from "./actions";
import { TransactionFields } from "./TransactionFields";
import { TransactionRow } from "./TransactionRow";

export default async function TransacoesPage() {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const [accounts, categories, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { householdId },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { householdId },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: { householdId },
      orderBy: { date: "desc" },
      include: { account: true, category: true },
    }),
  ]);

  const canCreate = accounts.length > 0 && categories.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Transações
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Lançamentos de receitas e despesas da casa.
        </p>
      </div>

      {canCreate ? (
        <form
          action={createTransaction}
          className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex sm:flex-wrap sm:items-end dark:border-zinc-800 dark:bg-zinc-900"
        >
          <TransactionFields
            accounts={accounts}
            categories={categories}
            showRecurrenceOptions
          />
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 sm:col-auto"
          >
            Adicionar
          </button>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          {accounts.length === 0 && categories.length === 0
            ? "Cadastre pelo menos uma conta e uma categoria para lançar transações."
            : accounts.length === 0
              ? "Cadastre pelo menos uma conta para lançar transações."
              : "Cadastre pelo menos uma categoria para lançar transações."}
          <br />
          {accounts.length === 0 && (
            <Link href="/contas" className="font-medium text-indigo-600 hover:text-indigo-500">
              Ir para Contas
            </Link>
          )}
          {accounts.length === 0 && categories.length === 0 && " · "}
          {categories.length === 0 && (
            <Link
              href="/categorias"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ir para Categorias
            </Link>
          )}
        </p>
      )}

      {transactions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Nenhuma transação lançada ainda.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              accounts={accounts}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
