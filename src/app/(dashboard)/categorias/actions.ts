"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EntryType } from "@/generated/prisma/client";

async function requireHouseholdId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user.householdId;
}

function parseEntryType(value: FormDataEntryValue | null): EntryType {
  if (value === "INCOME" || value === "EXPENSE") return value;
  throw new Error("Tipo de categoria inválido.");
}

function parseColor(value: FormDataEntryValue | null): string | null {
  const color = String(value ?? "").trim();
  return color || null;
}

export async function createCategory(formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const type = parseEntryType(formData.get("type"));
  const color = parseColor(formData.get("color"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.category.create({ data: { name, type, color, householdId } });
  revalidatePath("/categorias");
}

export async function updateCategory(id: string, formData: FormData) {
  const householdId = await requireHouseholdId();
  const name = String(formData.get("name") ?? "").trim();
  const type = parseEntryType(formData.get("type"));
  const color = parseColor(formData.get("color"));
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.category.updateMany({
    where: { id, householdId },
    data: { name, type, color },
  });
  revalidatePath("/categorias");
}

export async function deleteCategory(id: string) {
  const householdId = await requireHouseholdId();

  await prisma.category.deleteMany({ where: { id, householdId } });
  revalidatePath("/categorias");
}
