"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AccountType } from "@/generated/prisma/client";

async function requireHouseholdId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user.householdId;
}

function parseAccountType(value: FormDataEntryValue | null): AccountType {
  if (value === "BANK" || value === "CASH" || value === "CREDIT_CARD") {
    return value;
  }
  throw new Error("Tipo de conta inválido.");
}

export async function createAccount(formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const type = parseAccountType(formData.get("type"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.account.create({ data: { name, type, householdId } });
  revalidatePath("/contas");
  revalidatePath("/");
}

export async function updateAccount(id: string, formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const type = parseAccountType(formData.get("type"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.account.updateMany({
    where: { id, householdId },
    data: { name, type },
  });
  revalidatePath("/contas");
  revalidatePath("/");
}

export type DeleteAccountState = { error: string | null };

export async function deleteAccount(
  id: string,
  _prevState: DeleteAccountState,
  _formData: FormData,
): Promise<DeleteAccountState> {
  const householdId = await requireHouseholdId();

  const transactionCount = await prisma.transaction.count({
    where: { accountId: id, householdId },
  });
  if (transactionCount > 0) {
    const noun = transactionCount === 1 ? "transação" : "transações";
    return {
      error: `Não é possível excluir: há ${transactionCount} ${noun} nesta conta.`,
    };
  }

  await prisma.account.deleteMany({ where: { id, householdId } });
  revalidatePath("/contas");
  revalidatePath("/");
  return { error: null };
}
