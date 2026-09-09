/** Somme des encours des souscriptions actives — jamais stockée, calculée à la volée. */
export function totalEncours(subscriptions: { encours: number; status: string }[]): number {
  return subscriptions.filter((s) => s.status === "ACTIVE").reduce((sum, s) => sum + s.encours, 0);
}

/** Nombre de produits distincts souscrits activement par le client — indicateur de multi-équipement. */
export function multiEquipementCount(subscriptions: { status: string }[]): number {
  return subscriptions.filter((s) => s.status === "ACTIVE").length;
}
