"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireHouseholdId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user.householdId;
}

function parseAmount(value: FormDataEntryValue | null): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Valor inválido.");
  return amount;
}

function parseDeadline(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
  return date;
}

export async function createGoal(formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const deadline = parseDeadline(formData.get("deadline"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.goal.create({
    data: { name, targetAmount, deadline, householdId },
  });
  revalidatePath("/metas");
}

export async function updateGoal(id: string, formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = parseAmount(formData.get("targetAmount"));
  const currentAmount = Number(formData.get("currentAmount"));
  const deadline = parseDeadline(formData.get("deadline"));
  if (!name) throw new Error("Nome é obrigatório.");
  if (!Number.isFinite(currentAmount) || currentAmount < 0) {
    throw new Error("Valor guardado inválido.");
  }

  await prisma.goal.updateMany({
    where: { id, householdId },
    data: { name, targetAmount, currentAmount, deadline },
  });
  revalidatePath("/metas");
}

export async function deleteGoal(id: string) {
  const householdId = await requireHouseholdId();

  await prisma.goal.deleteMany({ where: { id, householdId } });
  revalidatePath("/metas");
}

export async function contributeToGoal(id: string, formData: FormData) {
  const householdId = await requireHouseholdId();
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount === 0) throw new Error("Valor inválido.");

  const goal = await prisma.goal.findFirst({ where: { id, householdId } });
  if (!goal) throw new Error("Meta inválida.");

  await prisma.goal.update({
    where: { id },
    data: { currentAmount: Math.max(0, goal.currentAmount + amount) },
  });
  revalidatePath("/metas");
}
