"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EntryType } from "@/generated/prisma/client";

type Recurrence = "NONE" | "FIXED" | "INSTALLMENT";

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

function parseRecurrence(value: FormDataEntryValue | null): Recurrence {
  if (value === "FIXED" || value === "INSTALLMENT") return value;
  return "NONE";
}

function parseRecurrenceCount(value: FormDataEntryValue | null): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 2 || count > 60) {
    throw new Error("Informe um número de meses/parcelas entre 2 e 60.");
  }
  return count;
}

// Adds `months` to `date`, clamping the day so e.g. Jan 31 + 1 month
// lands on Feb 28/29 instead of overflowing into March.
function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDayOfTargetMonth));
  return target;
}

// Splits `total` into `parts` amounts (rounded to cents) that sum back
// to exactly `total`, spreading the rounding remainder across the
// first installments instead of dumping it all on the last one.
function splitAmount(total: number, parts: number): number[] {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / parts);
  const remainder = totalCents - baseCents * parts;
  return Array.from(
    { length: parts },
    (_, i) => (baseCents + (i < remainder ? 1 : 0)) / 100,
  );
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
  const recurrence = parseRecurrence(formData.get("recurrence"));

  if (recurrence === "FIXED") {
    const months = parseRecurrenceCount(formData.get("months"));
    const recurrenceGroupId = randomUUID();

    await prisma.transaction.createMany({
      data: Array.from({ length: months }, (_, i) => ({
        ...fields,
        date: addMonthsClamped(fields.date, i),
        householdId: user.householdId,
        userId: user.id,
        isFixed: true,
        recurrenceGroupId,
      })),
    });
  } else if (recurrence === "INSTALLMENT") {
    const installmentTotal = parseRecurrenceCount(formData.get("installments"));
    const recurrenceGroupId = randomUUID();
    const amounts = splitAmount(fields.amount, installmentTotal);

    await prisma.transaction.createMany({
      data: amounts.map((amount, i) => ({
        ...fields,
        amount,
        date: addMonthsClamped(fields.date, i),
        householdId: user.householdId,
        userId: user.id,
        installmentNumber: i + 1,
        installmentTotal,
        recurrenceGroupId,
      })),
    });
  } else {
    await prisma.transaction.create({
      data: {
        ...fields,
        householdId: user.householdId,
        userId: user.id,
      },
    });
  }

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

export type DeleteTransactionState = { error: string | null };

export async function deleteTransaction(
  id: string,
  _prevState: DeleteTransactionState,
  _formData: FormData,
): Promise<DeleteTransactionState> {
  const user = await requireSession();

  const linkedGoalEntry = await prisma.goalEntry.findFirst({
    where: { transactionId: id, householdId: user.householdId },
    include: { goal: true },
  });
  if (linkedGoalEntry) {
    return {
      error: `Esta transação está ligada à meta "${linkedGoalEntry.goal.name}". Exclua o lançamento por lá.`,
    };
  }

  await prisma.transaction.deleteMany({
    where: { id, householdId: user.householdId },
  });
  revalidatePath("/transacoes");
  revalidatePath("/");
  return { error: null };
}

export async function deleteTransactionSeries(
  recurrenceGroupId: string | null,
  _prevState: DeleteTransactionState,
  _formData: FormData,
): Promise<DeleteTransactionState> {
  const user = await requireSession();
  if (!recurrenceGroupId) return { error: null };

  const linkedGoalEntry = await prisma.goalEntry.findFirst({
    where: {
      householdId: user.householdId,
      transaction: { recurrenceGroupId },
    },
    include: { goal: true },
  });
  if (linkedGoalEntry) {
    return {
      error: `Não é possível excluir a série: uma das transações está ligada à meta "${linkedGoalEntry.goal.name}".`,
    };
  }

  await prisma.transaction.deleteMany({
    where: { recurrenceGroupId, householdId: user.householdId },
  });
  revalidatePath("/transacoes");
  revalidatePath("/");
  return { error: null };
}
