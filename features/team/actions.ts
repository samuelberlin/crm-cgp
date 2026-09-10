"use server";

import { randomUUID } from "node:crypto";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasRole, requireUser } from "@/features/auth/session";
import { inviteTeamMemberSchema } from "./schemas";

export type InviteTeamMemberState =
  | { error: string }
  | { success: true; name: string; email: string; password: string }
  | null;

/**
 * Creates the teammate's account directly (name + generated password) rather than through
 * better-auth's own signUpEmail endpoint: that endpoint signs the newly created user in by
 * setting a session cookie on the caller's response, which would silently log the inviting
 * ADMIN out of their own session. Hashing with better-auth's own scrypt implementation keeps
 * the credential fully compatible with the normal login flow.
 */
export async function inviteTeamMember(
  _prevState: InviteTeamMemberState,
  formData: FormData,
): Promise<InviteTeamMemberState> {
  const session = await requireUser();
  if (!session.user.tenantId || !hasRole(session, ["ADMIN"])) {
    return { error: "Réservé aux administrateurs." };
  }

  const parsed = inviteTeamMemberSchema.safeParse({
    name: formData.get("memberName"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  const password = generateRandomString(16);
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name: parsed.data.name,
      email,
      emailVerified: false,
      role: parsed.data.role,
      tenantId: session.user.tenantId,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });

  revalidatePath("/settings");
  return { success: true, name: parsed.data.name, email, password };
}
