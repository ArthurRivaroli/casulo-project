"use client";

import { useActionState, useState } from "react";
import type { EntryType } from "@/generated/prisma/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { toDateInputValue } from "@/lib/dateInput";
import { RecurrenceBadge } from "@/components/RecurrenceBadge";
import {
  deleteTransaction,
  deleteTransactionSeries,
  updateTransaction,
  type DeleteTransactionState,
} from "./actions";
import { TransactionFields } from "./TransactionFields";

const initialDeleteState: DeleteTransactionState = { error: null };

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
  const deleteTransactionWithId = deleteTransaction.bind(null, transaction.id);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTransactionWithId,
    initialDeleteState,
  );
  const deleteSeriesWithGroupId = deleteTransactionSeries.bind(
    null,
    transaction.recurrenceGroupId,
  );
  const [deleteSeriesState, deleteSeriesAction, deleteSeriesPending] = useActionState(
    deleteSeriesWithGroupId,
    initialDeleteState,
  );

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateTransactionWithId(formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-end gap-3 px-4 py-3"
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
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
            {transaction.date.toLocaleDateString("pt-BR")}
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
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Editar
          </button>
          <form action={deleteAction}>
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                if (!confirm("Excluir esta transação?")) {
                  e.preventDefault();
                }
              }}
              className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
            >
              {transaction.recurrenceGroupId ? "Excluir esta" : "Excluir"}
            </button>
          </form>
          {transaction.recurrenceGroupId && (
            <form action={deleteSeriesAction}>
              <button
                type="submit"
                disabled={deleteSeriesPending}
                onClick={(e) => {
                  if (
                    !confirm(
                      "Excluir TODA a série (todas as ocorrências desta despesa fixa/parcela)?",
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
              >
                Excluir série
              </button>
            </form>
          )}
        </div>
      </div>
      {(deleteState.error || deleteSeriesState.error) && (
        <p className="text-sm text-red-600">
          {deleteState.error || deleteSeriesState.error}
        </p>
      )}
    </div>
  );
}
