"use client";

import { useActionState, useState } from "react";
import type { AccountType } from "@/generated/prisma/client";
import { ACCOUNT_TYPE_LABELS } from "@/lib/accountTypes";
import { formatCurrency } from "@/lib/formatCurrency";
import { EditIcon, TrashIcon } from "@/components/icons";
import { deleteAccount, updateAccount, type DeleteAccountState } from "./actions";

const initialDeleteState: DeleteAccountState = { error: null };

export function AccountRow({
  account,
  balance,
}: {
  account: { id: string; name: string; type: AccountType };
  balance: number;
}) {
  const [editing, setEditing] = useState(false);
  const updateAccountWithId = updateAccount.bind(null, account.id);
  const deleteAccountWithId = deleteAccount.bind(null, account.id);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountWithId,
    initialDeleteState,
  );

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateAccountWithId(formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-center gap-2 px-4 py-3"
      >
        <input
          name="name"
          defaultValue={account.name}
          required
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <select
          name="type"
          defaultValue={account.type}
          className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {account.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={
              balance > 0
                ? "font-medium text-emerald-600"
                : balance < 0
                  ? "font-medium text-red-600"
                  : "font-medium text-zinc-500 dark:text-zinc-400"
            }
          >
            {formatCurrency(balance)}
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
          <form action={deleteAction}>
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                if (!confirm(`Excluir a conta "${account.name}"?`)) {
                  e.preventDefault();
                }
              }}
              aria-label="Excluir"
              title="Excluir"
              className="text-red-600 hover:text-red-500 disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      {deleteState.error && (
        <p className="text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  );
}
