import type { AccountType } from "@/generated/prisma/client";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: "Banco",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
};
