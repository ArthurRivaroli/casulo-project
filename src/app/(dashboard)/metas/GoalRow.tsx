"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { toDateInputValue } from "@/lib/dateInput";
import { formatDate } from "@/lib/formatDate";
import { EditIcon, TrashIcon } from "@/components/icons";
import {
  addGoalEntry,
  deleteGoal,
  deleteGoalEntry,
  updateGoal,
} from "./actions";

type AccountOption = { id: string; name: string };
type GoalEntryData = {
  id: string;
  amount: number;
  date: Date;
  account: { name: string };
};

export function GoalRow({
  goal,
  accounts,
  today,
}: {
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    deadline: Date | null;
    entries: GoalEntryData[];
  };
  accounts: AccountOption[];
  today: string;
}) {
  const [editing, setEditing] = useState(false);
  const updateGoalWithId = updateGoal.bind(null, goal.id);
  const deleteGoalWithId = deleteGoal.bind(null, goal.id);
  const addGoalEntryWithId = addGoalEntry.bind(null, goal.id);

  const currentAmount = goal.entries.reduce((sum, e) => sum + e.amount, 0);
  const percentage = Math.min(
    100,
    Math.max(0, (currentAmount / goal.targetAmount) * 100),
  );
  const reached = currentAmount >= goal.targetAmount;
  const sortedEntries = [...goal.entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {editing ? (
        <form
          action={async (formData: FormData) => {
            await updateGoalWithId(formData);
            setEditing(false);
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nome
            </label>
            <input
              name="name"
              defaultValue={goal.name}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Meta
            </label>
            <input
              name="targetAmount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={goal.targetAmount}
              required
              className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Prazo
            </label>
            <input
              name="deadline"
              type="date"
              defaultValue={goal.deadline ? toDateInputValue(goal.deadline) : ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
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
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {goal.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {formatCurrency(currentAmount)} de {formatCurrency(goal.targetAmount)}
              {goal.deadline && ` · até ${formatDate(goal.deadline)}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar"
              title="Editar"
              className="text-indigo-600 hover:text-indigo-500"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <form action={deleteGoalWithId}>
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm(`Excluir a meta "${goal.name}"?`)) {
                    e.preventDefault();
                  }
                }}
                aria-label="Excluir"
                title="Excluir"
                className="text-red-600 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={reached ? "h-full bg-emerald-500" : "h-full bg-indigo-500"}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {sortedEntries.length > 0 && (
        <div className="mt-3 divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-zinc-500 dark:text-zinc-400">
                {formatDate(entry.date)} · {entry.account.name}
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={
                    entry.amount >= 0
                      ? "font-medium text-emerald-600"
                      : "font-medium text-red-600"
                  }
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {formatCurrency(entry.amount)}
                </span>
                <form action={deleteGoalEntry.bind(null, entry.id)}>
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm("Excluir este lançamento?")) {
                        e.preventDefault();
                      }
                    }}
                    aria-label="Excluir lançamento"
                    title="Excluir lançamento"
                    className="text-red-600 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Cadastre uma conta em Contas pra poder guardar/retirar dinheiro desta meta.
        </p>
      ) : (
        <form
          action={addGoalEntryWithId}
          className="mt-3 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tipo
            </label>
            <select
              name="direction"
              defaultValue="DEPOSIT"
              className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="DEPOSIT">Depósito</option>
              <option value="WITHDRAWAL">Retirada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Valor
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-24 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Data
            </label>
            <input
              name="date"
              type="date"
              required
              defaultValue={today}
              className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Conta
            </label>
            <select
              name="accountId"
              required
              className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Adicionar
          </button>
        </form>
      )}
    </div>
  );
}
