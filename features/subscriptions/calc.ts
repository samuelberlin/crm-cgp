/** Somme des encours des souscriptions actives — jamais stockée, calculée à la volée. */
export function totalEncours(subscriptions: { encours: number; status: string }[]): number {
  return subscriptions.filter((s) => s.status === "ACTIVE").reduce((sum, s) => sum + s.encours, 0);
}

/** Nombre de produits distincts souscrits activement par le client — indicateur de multi-équipement. */
export function multiEquipementCount(subscriptions: { status: string }[]): number {
  return subscriptions.filter((s) => s.status === "ACTIVE").length;
}

/**
 * Seuls les produits Retraite/Épargne représentent un capital réellement détenu par le
 * client (contrats de capitalisation). Les produits Prévoyance/Santé/Dommages sont des
 * primes d'assurance sans valeur de rachat : leur encours ne doit jamais alimenter le
 * patrimoine.
 */
export function subscriptionFeedsWealth(productCategory: string): boolean {
  return productCategory === "RETRAITE" || productCategory === "EPARGNE";
}
