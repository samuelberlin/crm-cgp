export const dashboardContactTabs = ["tous", "clients", "prospects", "csp", "produit"] as const;
export type DashboardContactTab = (typeof dashboardContactTabs)[number];

export const dashboardContactTabLabels: Record<DashboardContactTab, string> = {
  tous: "Tous",
  clients: "Clients",
  prospects: "Prospects",
  csp: "CSP",
  produit: "Produits détenus",
};

export type FilterableContact = {
  status: string;
  profession: string | null;
  products: string[];
};

/**
 * Un contact correspond-il à l'onglet actif ? Les onglets "CSP" et "Produits
 * détenus" ne filtrent qu'une fois une valeur précise choisie dans le
 * sous-filtre (`facet`) — sinon ils se comportent comme "Tous".
 */
export function matchesContactFilter(
  contact: FilterableContact,
  tab: DashboardContactTab,
  facet: string | null,
): boolean {
  switch (tab) {
    case "clients":
      return contact.status === "CLIENT";
    case "prospects":
      return contact.status === "PROSPECT";
    case "csp":
      return facet === null || contact.profession === facet;
    case "produit":
      return facet === null || contact.products.includes(facet);
    case "tous":
    default:
      return true;
  }
}

/** Valeurs distinctes (non vides), triées, pour peupler les puces de sous-filtre. */
export function distinctValues(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) => a.localeCompare(b));
}
