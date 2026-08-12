import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccount } from "./actions";
import { AccountRow } from "./AccountRow";

export default async function ContasPage() {
  const session = await getServerSession(authOptions);
  const householdId = session!.user.householdId;

  const [accounts, transactionSums] = await Promise.all([
    prisma.account.findMany({
      where: { householdId },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["accountId", "type"],
      where: { householdId },
      _sum: { amount: true },
    }),
  ]);

  const balanceByAccount = new Map<string, number>();
  for (const sum of transactionSums) {
    const amount = sum._sum.amount ?? 0;
    const current = balanceByAccount.get(sum.accountId) ?? 0;
    balanceByAccount.set(
      sum.accountId,
      current + (sum.type === "INCOME" ? amount : -amount),
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Contas
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Contas bancárias, dinheiro e cartões da casa.
        </p>
      </div>

      <form
        action={createAccount}
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
            placeholder="Ex: Conta à Ordem"
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
            defaultValue="BANK"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="BANK">Banco</option>
            <option value="CASH">Dinheiro</option>
            <option value="CREDIT_CARD">Cartão de crédito</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Adicionar
        </button>
      </form>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Nenhuma conta cadastrada ainda.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              balance={balanceByAccount.get(account.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
