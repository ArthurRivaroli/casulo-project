import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Casulo é uso restrito (só os moradores da casa) — cadastro público
// desabilitado até as rotas terem proteção/convite. Reative removendo este bloco.
const REGISTRATION_ENABLED = false;

export async function POST(request: Request) {
  if (!REGISTRATION_ENABLED) {
    return NextResponse.json(
      { error: "Cadastro desabilitado no momento." },
      { status: 403 }
    );
  }

  const { name, householdName, email, password } = await request.json();

  if (!name || !householdName || !email || !password) {
    return NextResponse.json(
      { error: "Preencha todos os campos." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 8 caracteres." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.household.create({
      data: {
        name: householdName,
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe uma conta com esse email." },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
