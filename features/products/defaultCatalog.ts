import type { ProductCategory } from "@/lib/generated/prisma/enums";

/**
 * Catalogue produits créé automatiquement pour chaque nouveau cabinet.
 * Correspond à l'offre effectivement commercialisée par l'utilisateur.
 */
export const defaultProductCatalog: {
  name: string;
  category: ProductCategory;
  provider: string;
  description: string;
}[] = [
  {
    name: "SwissLife Prévoyance TNS",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance spéciale artisans et commerçants, éligible loi Madelin.",
  },
  {
    name: "SwissLife Santé Particuliers & Madelin",
    category: "SANTE",
    provider: "SwissLife",
    description: "Complémentaire santé pour particuliers et travailleurs non salariés (Madelin).",
  },
  {
    name: "SwissLife Prévoyance Indépendants",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Maintien de revenus en cas d'arrêt de travail, invalidité ou décès.",
  },
  {
    name: "SwissLife Retraite",
    category: "RETRAITE",
    provider: "SwissLife",
    description: "Assurance vie individuelle en unités de compte et en euros, dédiée à la retraite.",
  },
  {
    name: "SwissLife Stratégic Premium",
    category: "EPARGNE",
    provider: "SwissLife",
    description: "Assurance vie épargne et transmission, gestion libre ou déléguée.",
  },
];
