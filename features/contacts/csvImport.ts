import { contactStatusLabels, contactStatusValues, updateContactSchema } from "./schemas";

type ImportableField = "firstName" | "lastName" | "email" | "phone" | "company" | "status" | "source";

export type ContactImportRow = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  status: (typeof contactStatusValues)[number];
  source?: string;
};

export type ContactImportRowResult = { data: ContactImportRow } | { error: string };

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const HEADER_ALIASES: Record<string, ImportableField> = {
  prenom: "firstName",
  "first name": "firstName",
  firstname: "firstName",
  nom: "lastName",
  "last name": "lastName",
  lastname: "lastName",
  email: "email",
  "e-mail": "email",
  mail: "email",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  societe: "company",
  entreprise: "company",
  company: "company",
  statut: "status",
  status: "status",
  source: "source",
};

const STATUS_LABEL_TO_VALUE = new Map(
  contactStatusValues.map((value) => [contactStatusLabels[value].toLowerCase(), value]),
);

/** Associe chaque colonne du CSV (par index) au champ contact qu'elle représente, si reconnue. */
export function mapCsvHeaders(headerRow: string[]): Map<number, ImportableField> {
  const map = new Map<number, ImportableField>();
  headerRow.forEach((header, index) => {
    const field = HEADER_ALIASES[normalizeHeader(header)];
    if (field) map.set(index, field);
  });
  return map;
}

/** Normalise un statut saisi en clé d'enum : accepte la clé ("CLIENT") ou le libellé français ("Client"). */
function normalizeStatus(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  if ((contactStatusValues as readonly string[]).includes(upper)) return upper;
  return STATUS_LABEL_TO_VALUE.get(trimmed.toLowerCase());
}

/**
 * Construit et valide un contact à partir d'une ligne CSV, en réutilisant les mêmes règles
 * que le formulaire d'édition (`updateContactSchema`). Un statut non reconnu est ignoré
 * plutôt que de faire échouer la ligne : elle retombe sur la valeur par défaut (Prospect).
 */
export function parseContactImportRow(
  headerMap: Map<number, ImportableField>,
  row: string[],
): ContactImportRowResult {
  // firstName/lastName gardent une chaîne vide si absentes, pour que le schéma déclenche
  // son propre message d'erreur ("Le prénom est requis.") plutôt qu'une erreur de type
  // générique sur un champ manquant. Les champs optionnels traitent déjà "" comme absent.
  const raw: Record<string, string | undefined> = {};
  for (const [index, field] of headerMap) {
    const value = row[index]?.trim() ?? "";
    raw[field] = field === "status" ? normalizeStatus(value) : value;
  }

  const parsed = updateContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ligne invalide." };
  }

  return {
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.company,
      status: parsed.data.status,
      source: parsed.data.source,
    },
  };
}
