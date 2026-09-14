import { contactStatusLabels, contactStatusValues, updateContactSchema } from "./schemas";

type SchemaField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "company"
  | "status"
  | "source"
  | "notes"
  | "address";
// Colonnes fréquentes sur un export "portefeuille" (produits détenus, encours, potentiel) :
// texte libre non structuré, qu'on ne peut pas valider comme un champ (montant, produit du
// catalogue...) sans risquer d'inventer de la donnée. On les regroupe plutôt dans les notes.
type NoteOnlyField = "products" | "encours" | "potential";
type ImportableField = SchemaField | NoteOnlyField;

export type ContactImportRow = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  status: (typeof contactStatusValues)[number];
  source?: string;
  notes?: string;
  address?: string;
  postalCode?: string;
  city?: string;
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
  "numero tel": "phone",
  tel: "phone",
  phone: "phone",
  societe: "company",
  entreprise: "company",
  company: "company",
  statut: "status",
  status: "status",
  source: "source",
  notes: "notes",
  note: "notes",
  "adresse postale": "address",
  adresse: "address",
  address: "address",
  produits: "products",
  produit: "products",
  encours: "encours",
  potentiel: "potential",
};

const NOTE_LABELS: Record<NoteOnlyField, string> = {
  products: "Produits",
  encours: "Encours",
  potential: "Potentiel",
};

const STATUS_LABEL_TO_VALUE = new Map(
  contactStatusValues.map((value) => [contactStatusLabels[value].toLowerCase(), value]),
);

/** Associe chaque colonne du fichier (par index) au champ contact qu'elle représente, si reconnue. */
export function mapCsvHeaders(headerRow: string[]): Map<number, ImportableField> {
  const map = new Map<number, ImportableField>();
  headerRow.forEach((header, index) => {
    const field = HEADER_ALIASES[normalizeHeader(header)];
    if (field) map.set(index, field);
  });
  return map;
}

/** Normalise un statut saisi en clé d'enum : accepte la clé ("CLIENT") ou le libellé français ("Client"). */
function normalizeStatus(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if ((contactStatusValues as readonly string[]).includes(upper)) return upper;
  return STATUS_LABEL_TO_VALUE.get(trimmed.toLowerCase()) ?? "";
}

const FRENCH_POSTAL_CODE = /\b(\d{5})\b/;

/**
 * Coupe une adresse postale française "en une ligne" (rue, code postal, ville) en ses trois
 * composantes, à partir du code postal (5 chiffres) qui sert de repère. Sans code postal
 * repérable, l'adresse entière est conservée telle quelle.
 */
function splitFrenchAddress(raw: string): { address: string; postalCode: string; city: string } {
  const match = FRENCH_POSTAL_CODE.exec(raw);
  if (!match || match.index === undefined) {
    return { address: raw, postalCode: "", city: "" };
  }
  return {
    address: raw.slice(0, match.index).trim(),
    postalCode: match[1],
    city: raw.slice(match.index + match[1].length).trim(),
  };
}

export type RawContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
  notes: string;
  address: string;
  postalCode: string;
  city: string;
};

/**
 * Extrait les champs bruts (non validés) d'une ligne. Trois ajustements par rapport à une
 * lecture directe :
 * - si Prénom est vide mais Nom contient plusieurs mots ("CRABIE PHILIPPE"), on suppose la
 *   convention "NOM Prénom" et on coupe sur le dernier mot ;
 * - une colonne "Adresse postale" en une seule ligne est coupée en rue/code postal/ville à
 *   partir du code postal (5 chiffres) repéré dedans ;
 * - Produits/Encours/Potentiel (texte libre, pas de sens à valider comme un montant ou un
 *   produit du catalogue) sont ajoutés aux notes plutôt qu'ignorés silencieusement.
 */
export function extractRawContactFields(headerMap: Map<number, ImportableField>, row: string[]): RawContactFields {
  const values: Partial<Record<ImportableField, string>> = {};
  for (const [index, field] of headerMap) {
    const value = row[index]?.trim() ?? "";
    if (!value) continue;
    const existing = values[field];
    // Plusieurs colonnes reconnues comme le même champ (ex. deux colonnes "Notes") : on
    // concatène plutôt que d'écraser.
    values[field] = existing ? `${existing} ${value}` : value;
  }

  let firstName = values.firstName ?? "";
  let lastName = values.lastName ?? "";
  if (!firstName && lastName.includes(" ")) {
    const lastSpace = lastName.lastIndexOf(" ");
    firstName = lastName.slice(lastSpace + 1).trim();
    lastName = lastName.slice(0, lastSpace).trim();
  }
  // Toujours pas de prénom (ex. juste "FAIFE", aucun prénom dans le fichier source) : on
  // duplique le nom plutôt que de rejeter la ligne — le contact importé reste visiblement
  // incomplet (mêmes nom/prénom) et facile à corriger, plutôt que perdu.
  if (!firstName && lastName) {
    firstName = lastName;
  }

  const { address, postalCode, city } = values.address
    ? splitFrenchAddress(values.address)
    : { address: "", postalCode: "", city: "" };

  const noteFragments: string[] = [];
  if (values.notes) noteFragments.push(values.notes);
  for (const field of ["products", "encours", "potential"] as const) {
    if (values[field]) noteFragments.push(`${NOTE_LABELS[field]} : ${values[field]}`);
  }

  return {
    firstName,
    lastName,
    email: values.email ?? "",
    phone: values.phone ?? "",
    company: values.company ?? "",
    status: normalizeStatus(values.status ?? ""),
    source: values.source ?? "",
    notes: noteFragments.join("\n"),
    address,
    postalCode,
    city,
  };
}

/**
 * Fusionne les lignes qui partagent le même nom (insensible à la casse) : un export
 * "portefeuille" liste souvent un client sur plusieurs lignes (une par produit détenu),
 * avec les coordonnées renseignées une seule fois. Le premier champ non vide du groupe
 * l'emporte ; les notes de toutes les lignes du groupe sont concaténées.
 */
export function mergeContactsByName(
  entries: { fields: RawContactFields; line: number }[],
): { fields: RawContactFields; line: number }[] {
  const order: string[] = [];
  const groups = new Map<string, { fields: RawContactFields; line: number }>();

  for (const entry of entries) {
    // Sans nom de famille, la ligne est de toute façon invalide (erreur de validation à
    // suivre) : on ne la fusionne pas avec d'autres lignes tout aussi vides, sous peine de
    // masquer plusieurs erreurs distinctes derrière une seule.
    const key = entry.fields.lastName
      ? `${entry.fields.firstName.toLowerCase()}|${entry.fields.lastName.toLowerCase()}`
      : `__line_${entry.line}`;
    const existing = groups.get(key);
    if (!existing) {
      order.push(key);
      groups.set(key, { fields: { ...entry.fields }, line: entry.line });
      continue;
    }
    const merged = existing.fields;
    merged.email ||= entry.fields.email;
    merged.phone ||= entry.fields.phone;
    merged.company ||= entry.fields.company;
    merged.status ||= entry.fields.status;
    merged.source ||= entry.fields.source;
    merged.address ||= entry.fields.address;
    merged.postalCode ||= entry.fields.postalCode;
    merged.city ||= entry.fields.city;
    if (entry.fields.notes && !merged.notes.includes(entry.fields.notes)) {
      merged.notes = merged.notes ? `${merged.notes}\n${entry.fields.notes}` : entry.fields.notes;
    }
  }

  return order.map((key) => groups.get(key)!);
}

/**
 * Valide des champs bruts (après extraction et fusion) en réutilisant les mêmes règles que
 * le formulaire d'édition (`updateContactSchema`).
 */
export function parseContactImportRow(fields: RawContactFields): ContactImportRowResult {
  const parsed = updateContactSchema.safeParse({
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    phone: fields.phone,
    company: fields.company,
    status: fields.status || undefined,
    source: fields.source,
    notes: fields.notes,
    address: fields.address,
    postalCode: fields.postalCode,
    city: fields.city,
  });
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
      notes: parsed.data.notes,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
    },
  };
}
