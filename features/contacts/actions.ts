"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { scheduleAutomationTask } from "@/features/automations/scheduleTask";
import { parseCsv } from "@/features/export/csv";
import { canAssignAdvisor, contactWhere } from "./access";
import {
  extractRawContactFields,
  mapCsvHeaders,
  mergeContactsByName,
  parseContactImportRow,
  type ContactImportRow,
} from "./csvImport";
import { createContactSchema, updateContactSchema } from "./schemas";
import { parseXlsx } from "./xlsxImport";

export type ContactFormState = { error: string } | null;

export async function createContact(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const parsed = createContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status") || undefined,
    source: formData.get("source"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const contact = await prisma.contact.create({
    data: {
      ...parsed.data,
      tenantId: session.user.tenantId,
      advisorId: session.user.id,
      activities: {
        create: {
          tenantId: session.user.tenantId,
          type: "CONTACT_CREATED",
          label: "Contact créé",
          userId: session.user.id,
        },
      },
    },
  });

  // Automatisation : un nouveau prospect reçoit une tâche de premier contact.
  if (contact.status === "PROSPECT") {
    const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
    await scheduleAutomationTask({
      tenantId: session.user.tenantId,
      contactId: contact.id,
      advisorId: contact.advisorId,
      title: "Premier contact",
      delayDays: tenant?.firstContactDelayDays ?? 1,
      activityType: "TASK_CREATED",
      activityLabel: "Tâche automatique créée : Premier contact",
    });
  }

  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  contactId: string,
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, ...contactWhere(session.user) },
  });
  if (!existing) {
    return { error: "Contact introuvable." };
  }

  const parsed = updateContactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status") || undefined,
    source: formData.get("source"),
    company: formData.get("company"),
    potential: formData.get("potential"),
    notes: formData.get("notes"),
    nextAction: formData.get("nextAction"),
    lastContactAt: formData.get("lastContactAt"),
    nextContactAt: formData.get("nextContactAt"),
    birthDate: formData.get("birthDate"),
    cspCategory: formData.get("cspCategory") || undefined,
    profession: formData.get("profession"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    maritalStatus: formData.get("maritalStatus") || undefined,
    advisorId: formData.get("advisorId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { advisorId, ...rest } = parsed.data;

  let nextAdvisorId: string | undefined;
  if (canAssignAdvisor(session.user.role as string) && advisorId) {
    const advisor = await prisma.user.findFirst({
      where: { id: advisorId, tenantId: session.user.tenantId },
    });
    if (!advisor) {
      return { error: "Conseiller invalide." };
    }
    nextAdvisorId = advisor.id;
  }

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      ...rest,
      lastContactAt: rest.lastContactAt ? new Date(rest.lastContactAt) : undefined,
      nextContactAt: rest.nextContactAt ? new Date(rest.nextContactAt) : undefined,
      birthDate: rest.birthDate ? new Date(rest.birthDate) : undefined,
      ...(nextAdvisorId ? { advisorId: nextAdvisorId } : {}),
    },
  });

  redirect(`/contacts/${contactId}`);
}

export type ImportContactsState =
  | { error: string }
  | { summary: { created: number; duplicates: number; errors: { line: number; reason: string }[] } }
  | null;

const XLSX_EXTENSION = /\.xlsx?$/i;

/**
 * Importe des contacts depuis un CSV ou un classeur Excel (charger un portefeuille
 * existant). Réutilise les mêmes règles de validation que le formulaire d'édition ; les
 * lignes qui partagent un même nom sont fusionnées (un export "portefeuille" liste souvent
 * un client sur plusieurs lignes, une par produit détenu), et les emails déjà présents dans
 * le cabinet (ou en double dans le fichier) sont ignorés plutôt que dupliqués.
 */
export async function importContacts(
  _prevState: ImportContactsState,
  formData: FormData,
): Promise<ImportContactsState> {
  const session = await requireUser();
  if (!session.user.tenantId) {
    return { error: "Aucun cabinet associé à votre compte." };
  }
  const tenantId = session.user.tenantId;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier CSV ou Excel (.xlsx)." };
  }

  let rows: string[][];
  try {
    rows = XLSX_EXTENSION.test(file.name)
      ? parseXlsx(await file.arrayBuffer())
      : parseCsv(await file.text());
  } catch {
    return { error: "Le fichier n'a pas pu être lu. Vérifiez qu'il s'agit bien d'un CSV ou d'un .xlsx valide." };
  }
  if (rows.length === 0) {
    return { error: "Le fichier est vide." };
  }

  const [headerRow, ...dataRows] = rows;
  const headerMap = mapCsvHeaders(headerRow);
  const mappedFields = new Set(headerMap.values());
  if (!mappedFields.has("firstName") && !mappedFields.has("lastName")) {
    return { error: "Colonnes Prénom et Nom introuvables dans le fichier (en-têtes reconnus : Prénom, Nom...)." };
  }

  const existingContacts = await prisma.contact.findMany({
    where: { ...contactWhere(session.user), email: { not: null } },
    select: { email: true },
  });
  const existingEmails = new Set(
    existingContacts.map((c) => c.email).filter((e): e is string => Boolean(e)).map((e) => e.toLowerCase()),
  );

  const rawEntries = dataRows.map((row, i) => ({
    fields: extractRawContactFields(headerMap, row),
    line: i + 2, // +1 pour l'en-tête, +1 pour un numéro de ligne 1-indexé.
  }));
  const merged = mergeContactsByName(rawEntries);

  const toCreate: ContactImportRow[] = [];
  const errors: { line: number; reason: string }[] = [];
  const seenEmails = new Set<string>();
  let duplicates = 0;

  for (const { fields, line } of merged) {
    const result = parseContactImportRow(fields);
    if ("error" in result) {
      errors.push({ line, reason: result.error });
      continue;
    }

    const email = result.data.email?.toLowerCase();
    if (email && (existingEmails.has(email) || seenEmails.has(email))) {
      duplicates++;
      continue;
    }
    if (email) seenEmails.add(email);
    toCreate.push(result.data);
  }

  if (toCreate.length > 0) {
    await prisma.contact.createMany({
      data: toCreate.map((contact) => ({ ...contact, tenantId })),
    });
    revalidatePath("/contacts");
  }

  return { summary: { created: toCreate.length, duplicates, errors } };
}
