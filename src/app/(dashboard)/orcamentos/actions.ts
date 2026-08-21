"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_AMOUNT = 1_000_000_000;

async function requireHouseholdId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user.householdId;
}

export async function setBudget(
  categoryId: string,
  month: number,
  year: number,
  formData: FormData,
) {
  const householdId = await requireHouseholdId();

  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId },
  });
  if (!category) throw new Error("Categoria inválida.");

  const raw = String(formData.get("amount") ?? "").trim();
  const amount = raw === "" ? null : Number(raw);

  if (amount === null || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    await prisma.budget.deleteMany({
      where: { householdId, categoryId, month, year },
    });
  } else {
    await prisma.budget.upsert({
      where: {
        householdId_categoryId_month_year: {
          householdId,
          categoryId,
          month,
          year,
        },
      },
      create: { householdId, categoryId, month, year, amount },
      update: { amount },
    });
  }

  revalidatePath("/orcamentos");
}
