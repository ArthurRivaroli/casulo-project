"use client";

import { useActionState, useState } from "react";
import type { EntryType } from "@/generated/prisma/client";
import { ENTRY_TYPE_LABELS } from "@/lib/entryTypes";
import { EditIcon, TrashIcon } from "@/components/icons";
import { deleteCategory, updateCategory, type DeleteCategoryState } from "./actions";

const DEFAULT_COLOR = "#6366f1";
const initialDeleteState: DeleteCategoryState = { error: null };

export function CategoryRow({
  category,
}: {
  category: { id: string; name: string; type: EntryType; color: string | null };
}) {
  const [editing, setEditing] = useState(false);
  const updateCategoryWithId = updateCategory.bind(null, category.id);
  const deleteCategoryWithId = deleteCategory.bind(null, category.id);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategoryWithId,
    initialDeleteState,
  );

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateCategoryWithId(formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-center gap-2 px-4 py-3"
      >
        <input
          type="color"
          name="color"
          defaultValue={category.color ?? DEFAULT_COLOR}
          className="h-9 w-9 rounded-lg border border-zinc-300 dark:border-zinc-700"
        />
        <input
          name="name"
          defaultValue={category.name}
          required
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <select
          name="type"
          defaultValue={category.type}
          className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
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
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? DEFAULT_COLOR }}
          />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {category.name}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {ENTRY_TYPE_LABELS[category.type]}
            </p>
          </div>
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
          <form action={deleteAction}>
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                if (!confirm(`Excluir a categoria "${category.name}"?`)) {
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
