"use client";

import { useActionState, useState } from "react";
import { EditIcon, TrashIcon } from "@/components/icons";
import { deleteUser, updateUser, type DeleteUserState } from "./actions";

const initialDeleteState: DeleteUserState = { error: null };

export function UserRow({
  user,
  isSelf,
}: {
  user: { id: string; name: string; email: string; isAdmin: boolean };
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const updateUserWithId = updateUser.bind(null, user.id);
  const deleteUserWithId = deleteUser.bind(null, user.id);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUserWithId,
    initialDeleteState,
  );

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateUserWithId(formData);
          setEditing(false);
        }}
        className="grid grid-cols-2 gap-3 px-4 py-3 sm:flex sm:flex-wrap sm:items-end"
      >
        <div className="col-span-2 sm:min-w-[140px] sm:flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nome
          </label>
          <input
            name="name"
            defaultValue={user.name}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="col-span-2 sm:min-w-[160px] sm:flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="col-span-2 sm:min-w-[160px] sm:flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nova senha
          </label>
          <input
            name="password"
            type="password"
            placeholder="Deixe em branco pra manter a mesma"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50">
              {user.name}
            </p>
            {user.isAdmin && (
              <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Admin
              </span>
            )}
          </div>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            title="Editar"
            className="text-indigo-600 hover:text-indigo-500"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          {!isSelf && (
            <form action={deleteAction}>
              <button
                type="submit"
                disabled={deletePending}
                onClick={(e) => {
                  if (!confirm(`Excluir o usuário "${user.name}"?`)) {
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
          )}
        </div>
      </div>
      {deleteState.error && (
        <p className="text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  );
}
