"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EntryType } from "@/generated/prisma/client";

const DEPOSIT_CATEGORY_NAME = "Poupança";
const WITHDRAWAL_CATEGORY_NAME = "Resgate de poupança";
const SYSTEM_CATEGORY_COLOR = "#6366f1";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user;
}

function parseAmount(value: FormDataEntryValue | null): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido.");
  return amount;
}

function parseDate(value: FormDataEntryValue | null): Date {
  const raw = String(value ?? "").trim();
  if (!raw) return new Date();
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
  return date;
}

function parseDeadline(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
  return date;
}

function parseDirection(value: FormDataEntryValue | null): "DEPOSIT" | "WITHDRAWAL" {
  return value === "WITHDRAWAL" ? "WITHDRAWAL" : "DEPOSIT";
}

async function findOrCreateSystemCategory(
  householdId: string,
  name: string,
  type: EntryType,
) {
  const existing = await prisma.category.findFirst({
    where: { householdId, name, type },
  });
  if (existing) return existing;

  return prisma.category.create({
    data: { householdId, name, type, color: SYSTEM_CATEGORY_COLOR },
  });
}

export async function createGoal(formData: FormData) {
  const user = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const deadline = parseDeadline(formData.get("deadline"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.goal.create({
    data: { name, targetAmount, deadline, householdId: user.householdId },
  });
  revalidatePath("/metas");
}

export async function updateGoal(id: string, formData: FormData) {
  const user = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const deadline = parseDeadline(formData.get("deadline"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.goal.updateMany({
    where: { id, householdId: user.householdId },
    data: { name, targetAmount, deadline },
  });
  revalidatePath("/metas");
}

export async function deleteGoal(id: string) {
  const user = await requireSession();

  // Cascade removes the GoalEntry rows, but keeps the real Transactions
  // they generated — deleting a goal shouldn't erase money that actually
  // moved between accounts.
  await prisma.goal.deleteMany({ where: { id, householdId: user.householdId } });
  revalidatePath("/metas");
}

export async function addGoalEntry(goalId: string, formData: FormData) {
  const user = await requireSession();
  const householdId = user.householdId;

  const goal = await prisma.goal.findFirst({ where: { id: goalId, householdId } });
  if (!goal) throw new Error("Meta inválida.");

  const accountId = String(formData.get("accountId") ?? "");
  const account = await prisma.account.findFirst({
    where: { id: accountId, householdId },
  });
  if (!account) throw new Error("Conta inválida.");

  const direction = parseDirection(formData.get("direction"));
  const amount = parseAmount(formData.get("amount"));
  const date = parseDate(formData.get("date"));

  const isWithdrawal = direction === "WITHDRAWAL";
  const transactionType: EntryType = isWithdrawal ? "INCOME" : "EXPENSE";
  const categoryName = isWithdrawal ? WITHDRAWAL_CATEGORY_NAME : DEPOSIT_CATEGORY_NAME;
  const category = await findOrCreateSystemCategory(
    householdId,
    categoryName,
    transactionType,
  );

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        amount,
        date,
        type: transactionType,
        description: `${isWithdrawal ? "Retirada de" : "Depósito em"} meta: ${goal.name}`,
        householdId,
        accountId,
        categoryId: category.id,
        userId: user.id,
      },
    });
    await tx.goalEntry.create({
      data: {
        amount: isWithdrawal ? -amount : amount,
        date,
        goalId,
        accountId,
        householdId,
        transactionId: transaction.id,
      },
    });
  });

  revalidatePath("/metas");
  revalidatePath("/contas");
  revalidatePath("/transacoes");
  revalidatePath("/");
}

export async function deleteGoalEntry(id: string) {
  const user = await requireSession();

  const entry = await prisma.goalEntry.findFirst({
    where: { id, householdId: user.householdId },
  });
  if (!entry) return;

  await prisma.$transaction([
    prisma.goalEntry.delete({ where: { id: entry.id } }),
    prisma.transaction.delete({ where: { id: entry.transactionId } }),
  ]);

  revalidatePath("/metas");
  revalidatePath("/contas");
  revalidatePath("/transacoes");
  revalidatePath("/");
}
