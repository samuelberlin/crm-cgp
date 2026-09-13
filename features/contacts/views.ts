import type { ContactStatus, CspCategory } from "@/lib/generated/prisma/enums";

export const contactViewValues = ["tous", "clients", "prospects", "csp", "produit"] as const;
export type ContactView = (typeof contactViewValues)[number];

export const contactViewLabels: Record<ContactView, string> = {
  tous: "Tous",
  clients: "Clients",
  prospects: "Prospects",
  csp: "CSP",
  produit: "Produits détenus",
};

const CLIENT: ContactStatus = "CLIENT";
const PROSPECT: ContactStatus = "PROSPECT";

/**
 * Fragment de `where` Prisma pour l'onglet actif. Les onglets "CSP" et "Produits
 * détenus" n'appliquent leur filtre qu'une fois une valeur précise choisie dans
 * le sous-filtre (catégorie CSP / produit) — sinon ils se comportent comme "Tous".
 */
export function contactViewWhere(
  view: ContactView,
  { cspCategory, productId = "" }: { cspCategory?: CspCategory | ""; productId?: string } = {},
) {
  switch (view) {
    case "clients":
      return { status: CLIENT };
    case "prospects":
      return { status: PROSPECT };
    case "csp":
      return cspCategory ? { cspCategory } : {};
    case "produit":
      return productId ? { subscriptions: { some: { productId, status: "ACTIVE" as const } } } : {};
    case "tous":
    default:
      return {};
  }
}
