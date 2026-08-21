"use client";

import { useState, useTransition } from "react";
import type { EntryType } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { toDateInputValue } from "@/lib/dateInput";
import { formatDate } from "@/lib/formatDate";
import { RecurrenceBadge } from "@/components/RecurrenceBadge";
import { EditIcon, TrashIcon } from "@/components/icons";
import {
  deleteTransaction,
  deleteTransactionSeries,
  updateTransaction,
} from "./actions";
import { TransactionFields } from "./TransactionFields";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; type: EntryType };

export function TransactionRow({
  transaction,
  accounts,
  categories,
}: {
  transaction: {
    id: string;
    type: EntryType;
    amount: number;
    date: Date;
    description: string | null;
    accountId: string;
    categoryId: string;
    account: { name: string };
    category: { name: string };
    isFixed: boolean;
    installmentNumber: number | null;
    installmentTotal: number | null;
    recurrenceGroupId: string | null;
  };
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const [editing, setEditing] = useState(false);
  const updateTransactionWithId = updateTransaction.bind(null, transaction.id);
  const [isDeleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    if (transaction.recurrenceGroupId) {
      const wantsWholeSeries = confirm(
        "Esta transação faz parte de uma série (fixa ou parcelada).\n\n" +
          "OK = excluir a SÉRIE INTEIRA (todas as ocorrências)\n" +
          "Cancelar = excluir só esta ocorrência (você confirma em seguida)",
      );
      if (wantsWholeSeries) {
        startDelete(async () => {
          const result = await deleteTransactionSeries(
            transaction.recurrenceGroupId,
            { error: null },
            new FormData(),
          );
          setDeleteError(result.error);
        });
        return;
      }
      if (!confirm("Excluir apenas esta ocorrência?")) return;
    } else if (!confirm("Excluir esta transação?")) {
      return;
    }

    startDelete(async () => {
      const result = await deleteTransaction(
        transaction.id,
        { error: null },
        new FormData(),
      );
      setDeleteError(result.error);
    });
  }

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateTransactionWithId(formData);
          setEditing(false);
        }}
        className="grid grid-cols-2 gap-3 px-4 py-3 sm:flex sm:flex-wrap sm:items-end"
      >
        <TransactionFields
          accounts={accounts}
          categories={categories}
          defaultValues={{
            type: transaction.type,
            amount: transaction.amount,
            date: toDateInputValue(transaction.date),
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            description: transaction.description ?? "",
          }}
        />
        <button
          type="submit"
          className="col-span-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:col-auto"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="col-span-2 text-sm text-zinc-500 hover:text-zinc-700 sm:col-auto dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {transaction.description || transaction.category.name}
            </p>
            <RecurrenceBadge
              isFixed={transaction.isFixed}
              installmentNumber={transaction.installmentNumber}
              installmentTotal={transaction.installmentTotal}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {transaction.category.name} · {transaction.account.name} ·{" "}
            {formatDate(transaction.date)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={
              transaction.type === "INCOME"
                ? "font-medium text-emerald-600"
                : "font-medium text-red-600"
            }
          >
            {transaction.type === "INCOME" ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            title="Editar"
            className="text-indigo-600 hover:text-indigo-500"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Excluir"
            title="Excluir"
            className="text-red-600 hover:text-red-500 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
    </div>
  );
}
