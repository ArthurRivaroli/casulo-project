import type { EntryType } from "@/generated/prisma/client";

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
};
