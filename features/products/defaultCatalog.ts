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
  {
    name: "SwissLife PER Individuel",
    category: "RETRAITE",
    provider: "SwissLife",
    description: "Plan d'épargne retraite individuel (anciennement PERP et Madelin).",
  },
  {
    name: "SwissLife PER Obligatoire",
    category: "RETRAITE",
    provider: "SwissLife",
    description: "PER collectif obligatoire d'entreprise, cotisation employeur/salarié.",
  },
  {
    name: "SwissLife PER Collectif",
    category: "RETRAITE",
    provider: "SwissLife",
    description: "PER collectif à adhésion facultative pour les salariés d'une entreprise.",
  },
  {
    name: "SwissLife IFC/IL",
    category: "EPARGNE",
    provider: "SwissLife",
    description: "Indemnités de fin de carrière / de licenciement, contrat collectif entreprise.",
  },
  {
    name: "SwissLife Santé Retraités",
    category: "SANTE",
    provider: "SwissLife",
    description: "Complémentaire santé dédiée aux retraités.",
  },
  {
    name: "SwissLife Santé Additionnelle",
    category: "SANTE",
    provider: "SwissLife",
    description: "Surcomplémentaire santé venant renforcer un contrat existant.",
  },
  {
    name: "Ma Formule Hospitalisation",
    category: "SANTE",
    provider: "SwissLife",
    description: "Garantie hospitalisation seule.",
  },
  {
    name: "SwissLife Santé Frontaliers Suisse",
    category: "SANTE",
    provider: "SwissLife",
    description: "Complémentaire santé pour les travailleurs frontaliers en Suisse.",
  },
  {
    name: "Confort Santé",
    category: "SANTE",
    provider: "SwissLife",
    description: "Complémentaire santé individuelle, gamme Confort.",
  },
  {
    name: "Confort Hospitalisation",
    category: "SANTE",
    provider: "SwissLife",
    description: "Garantie hospitalisation individuelle, gamme Confort.",
  },
  {
    name: "SwissLife Prévoyance Santé",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance individuelle axée maintien de revenus en cas d'arrêt de travail.",
  },
  {
    name: "SwissLife Prévoyance Entreprise + Santé",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance collective d'entreprise, module santé (SLPE+).",
  },
  {
    name: "SwissLife Prévoyance Entreprise + Dirigeant",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance collective d'entreprise dédiée aux dirigeants.",
  },
  {
    name: "SwissLife Prévoyance Entreprise + Prévoyance",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance collective d'entreprise, module prévoyance des salariés.",
  },
  {
    name: "SwissLife Prévoyance Salariés",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Prévoyance collective destinée aux salariés d'une entreprise.",
  },
  {
    name: "SwissLife Corporate Expat",
    category: "PREVOYANCE",
    provider: "SwissLife",
    description: "Couverture santé et prévoyance pour salariés expatriés.",
  },
  {
    name: "Multirisques Commerce",
    category: "DOMMAGES",
    provider: "SwissLife",
    description: "Assurance multirisque pour les commerces et professionnels.",
  },
  {
    name: "SwissLife Flotte Automobiles",
    category: "DOMMAGES",
    provider: "SwissLife",
    description: "Assurance flotte automobile pour entreprises.",
  },
];
