"use client";

import { useState } from "react";
import type { EntryType } from "@/generated/prisma/client";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; type: EntryType };

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";
const labelClass =
  "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function TransactionFields({
  accounts,
  categories,
  defaultValues,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultValues?: {
    type: EntryType;
    amount: number;
    date: string;
    accountId: string;
    categoryId: string;
    description: string;
  };
}) {
  const [type, setType] = useState<EntryType>(defaultValues?.type ?? "EXPENSE");
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <>
      <div>
        <label htmlFor="type" className={labelClass}>
          Tipo
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as EntryType)}
          className={inputClass}
        >
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </select>
      </div>
      <div>
        <label htmlFor="amount" className={labelClass}>
          Valor
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={defaultValues?.amount}
          className={`${inputClass} w-28`}
        />
      </div>
      <div>
        <label htmlFor="date" className={labelClass}>
          Data
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date}
          className={inputClass}
        />
      </div>
      <div className="min-w-[140px] flex-1">
        <label htmlFor="accountId" className={labelClass}>
          Conta
        </label>
        <select
          id="accountId"
          name="accountId"
          required
          defaultValue={defaultValues?.accountId}
          className={inputClass}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[140px] flex-1">
        <label htmlFor="categoryId" className={labelClass}>
          Categoria
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={defaultValues?.categoryId}
          className={inputClass}
        >
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px] flex-1">
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <input
          id="description"
          name="description"
          placeholder="Opcional"
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>
    </>
  );
}
