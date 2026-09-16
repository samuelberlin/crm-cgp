import type { ContactStatus, CspCategory } from "@/lib/generated/prisma/enums";

export const contactViewValues = ["tous", "statut", "csp", "produit"] as const;
export type ContactView = (typeof contactViewValues)[number];

export const contactViewLabels: Record<ContactView, string> = {
  tous: "Tous",
  statut: "Statut",
  csp: "CSP",
  produit: "Produits détenus",
};

/**
 * Fragment de `where` Prisma pour l'onglet actif. Les onglets "Statut", "CSP" et
 * "Produits détenus" n'appliquent leur filtre qu'une fois une valeur précise choisie
 * dans le sous-filtre (statut / catégorie CSP / produit) — sinon ils se comportent
 * comme "Tous".
 */
export function contactViewWhere(
  view: ContactView,
  {
    status,
    cspCategory,
    productId = "",
  }: { status?: ContactStatus | ""; cspCategory?: CspCategory | ""; productId?: string } = {},
) {
  switch (view) {
    case "statut":
      return status ? { status } : {};
    case "csp":
      return cspCategory ? { cspCategory } : {};
    case "produit":
      return productId ? { subscriptions: { some: { productId, status: "ACTIVE" as const } } } : {};
    case "tous":
    default:
      return {};
  }
}
