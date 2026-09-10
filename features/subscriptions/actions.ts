"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { createSubscriptionSchema } from "./schemas";
import { subscriptionWhere } from "./access";
import { subscriptionFeedsWealth } from "./calc";

export type SubscriptionFormState = { error: string } | null;

export async function createSubscription(
  _prevState: SubscriptionFormState,
  formData: FormData,
): Promise<SubscriptionFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createSubscriptionSchema.safeParse({
    contactId: formData.get("contactId"),
    productId: formData.get("productId"),
    encours: formData.get("encours"),
    subscribedAt: formData.get("subscribedAt"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, ...contactWhere(session.user) },
  });
  if (!contact) {
    return { error: "Contact introuvable." };
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, tenantId: session.user.tenantId, active: true },
  });
  if (!product) {
    return { error: "Produit introuvable." };
  }

  const subscription = await prisma.subscription.create({
    data: {
      encours: parsed.data.encours,
      note: parsed.data.note,
      tenantId: session.user.tenantId,
      contactId: contact.id,
      productId: product.id,
      subscribedAt: parsed.data.subscribedAt ? new Date(parsed.data.subscribedAt) : new Date(),
    },
  });

  // Les produits Retraite/Épargne représentent un capital réellement détenu : on les
  // reflète automatiquement dans le patrimoine pour éviter une double saisie.
  if (subscriptionFeedsWealth(product.category)) {
    await prisma.wealthItem.create({
      data: {
        tenantId: session.user.tenantId,
        contactId: contact.id,
        subscriptionId: subscription.id,
        kind: "ACTIF",
        // On ne connaît pas l'enveloppe précise du produit souscrit (PER, assurance-vie...) :
        // rubrique générique, à affiner manuellement par le conseiller si besoin.
        category: "AUTRE_FINANCIER",
        label: product.name,
        amount: parsed.data.encours,
      },
    });
  }

  await prisma.activity.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: contact.id,
      type: "SUBSCRIPTION_CREATED",
      label: `Souscription : ${product.name}`,
    },
  });

  revalidatePath(`/contacts/${contact.id}`);
  return null;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const session = await requireUser();
  if (!session.user.tenantId) return;

  const existing = await prisma.subscription.findFirst({
    where: { id: subscriptionId, ...subscriptionWhere(session.user) },
    include: { product: true },
  });
  if (!existing || existing.status === "ANNULE") return;

  await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: "ANNULE" } });

  // Le client ne détient plus ce capital : retire l'actif patrimoine lié, s'il existe.
  await prisma.wealthItem.deleteMany({ where: { subscriptionId } });

  await prisma.activity.create({
    data: {
      tenantId: session.user.tenantId,
      contactId: existing.contactId,
      type: "SUBSCRIPTION_CANCELLED",
      label: `Souscription résiliée : ${existing.product.name}`,
    },
  });

  revalidatePath(`/contacts/${existing.contactId}`);
}
