"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EntryType } from "@/generated/prisma/client";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user;
}

function parseEntryType(value: FormDataEntryValue | null): EntryType {
  if (value === "INCOME" || value === "EXPENSE") return value;
  throw new Error("Tipo inválido.");
}

function parseAmount(value: FormDataEntryValue | null): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido.");
  return amount;
}

function parseDate(value: FormDataEntryValue | null): Date {
  const date = new Date(`${String(value ?? "")}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
  return date;
}

async function readTransactionFields(formData: FormData, householdId: string) {
  const type = parseEntryType(formData.get("type"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, householdId } }),
    prisma.category.findFirst({ where: { id: categoryId, householdId } }),
  ]);
  if (!account) throw new Error("Conta inválida.");
  if (!category) throw new Error("Categoria inválida.");

  return { type, amount, date, accountId, categoryId, description };
}

export async function createTransaction(formData: FormData) {
  const user = await requireSession();
  const fields = await readTransactionFields(formData, user.householdId);

  await prisma.transaction.create({
    data: {
      ...fields,
      householdId: user.householdId,
      userId: user.id,
    },
  });
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function updateTransaction(id: string, formData: FormData) {
  const user = await requireSession();
  const fields = await readTransactionFields(formData, user.householdId);

  await prisma.transaction.updateMany({
    where: { id, householdId: user.householdId },
    data: fields,
  });
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  const user = await requireSession();

  await prisma.transaction.deleteMany({
    where: { id, householdId: user.householdId },
  });
  revalidatePath("/transacoes");
  revalidatePath("/");
}
