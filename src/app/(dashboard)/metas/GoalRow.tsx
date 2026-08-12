"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { contributeToGoal, deleteGoal, updateGoal } from "./actions";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function GoalRow({
  goal,
}: {
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date | null;
  };
}) {
  const [editing, setEditing] = useState(false);
  const updateGoalWithId = updateGoal.bind(null, goal.id);
  const deleteGoalWithId = deleteGoal.bind(null, goal.id);
  const contributeToGoalWithId = contributeToGoal.bind(null, goal.id);

  if (editing) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
              Valor guardado
            </label>
            <input
              name="currentAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={goal.currentAmount}
              required
              className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
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
      </div>
    );
  }

  const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const reached = goal.currentAmount >= goal.targetAmount;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{goal.name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
            {goal.deadline && ` · até ${goal.deadline.toLocaleDateString("pt-PT")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Editar
          </button>
          <form action={deleteGoalWithId}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm(`Excluir a meta "${goal.name}"?`)) {
                  e.preventDefault();
                }
              }}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Excluir
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={reached ? "h-full bg-emerald-500" : "h-full bg-indigo-500"}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {!reached && (
        <form
          action={contributeToGoalWithId}
          className="mt-3 flex items-center gap-2"
        >
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Valor"
            required
            className="w-28 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Adicionar guardado
          </button>
        </form>
      )}
    </div>
  );
}
