"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultProductCatalog } from "@/features/products/defaultCatalog";
import { defaultFiscalReminders } from "@/features/reminders/defaultReminders";
import { registerSchema } from "./schemas";

export type RegisterState = { error: string } | null;

export async function registerTenant(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    cabinetName: formData.get("cabinetName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { cabinetName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const tenant = await prisma.tenant.create({ data: { name: cabinetName } });

  await prisma.product.createMany({
    data: defaultProductCatalog.map((product) => ({ ...product, tenantId: tenant.id })),
  });

  await prisma.fiscalReminder.createMany({
    data: defaultFiscalReminders.map((reminder) => ({ ...reminder, tenantId: tenant.id })),
  });

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    await prisma.tenant.delete({ where: { id: tenant.id } });
    if (error instanceof APIError) {
      return { error: "Impossible de créer le compte. Vérifiez les informations puis réessayez." };
    }
    throw error;
  }

  await prisma.user.update({
    where: { email },
    data: { tenantId: tenant.id, role: "ADMIN" },
  });

  redirect("/");
}
