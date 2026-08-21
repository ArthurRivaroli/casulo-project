"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 6;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Não autenticado.");
  if (!session.user.isAdmin) {
    throw new Error("Apenas o administrador pode gerenciar usuários.");
  }
  return session.user;
}

function parseEmail(value: FormDataEntryValue | null): string {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Email inválido.");
  return email;
}

export async function createUser(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = parseEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!name) throw new Error("Nome é obrigatório.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Já existe uma conta com esse email.");

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, password: hashedPassword, householdId: admin.householdId },
  });
  revalidatePath("/usuarios");
}

export async function updateUser(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = parseEmail(formData.get("email"));
  const newPassword = String(formData.get("password") ?? "");
  if (!name) throw new Error("Nome é obrigatório.");

  const emailTaken = await prisma.user.findFirst({
    where: { email, householdId: admin.householdId, NOT: { id } },
  });
  if (emailTaken) throw new Error("Já existe uma conta com esse email.");

  const data: { name: string; email: string; password?: string } = { name, email };
  if (newPassword) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.updateMany({
    where: { id, householdId: admin.householdId },
    data,
  });
  revalidatePath("/usuarios");
}

export type DeleteUserState = { error: string | null };

export async function deleteUser(
  id: string,
  _prevState: DeleteUserState,
  _formData: FormData,
): Promise<DeleteUserState> {
  const admin = await requireAdmin();

  if (id === admin.id) {
    return { error: "Você não pode excluir sua própria conta." };
  }

  const userCount = await prisma.user.count({
    where: { householdId: admin.householdId },
  });
  if (userCount <= 1) {
    return { error: "Não é possível excluir o único usuário da casa." };
  }

  const transactionCount = await prisma.transaction.count({ where: { userId: id } });
  if (transactionCount > 0) {
    const noun = transactionCount === 1 ? "transação" : "transações";
    return {
      error: `Não é possível excluir: há ${transactionCount} ${noun} lançadas por esse usuário.`,
    };
  }

  await prisma.user.deleteMany({ where: { id, householdId: admin.householdId } });
  revalidatePath("/usuarios");
  return { error: null };
}
