import { formatCurrency, formatDate } from "@/lib/format";
import { contactStatusLabels, maritalStatusLabels } from "@/features/contacts/schemas";
import { opportunityCategoryLabels, opportunityStageLabels } from "@/features/opportunities/schemas";

const SYSTEM_PERSONA =
  "Tu es l'assistant d'un Conseiller en Gestion de Patrimoine (CGP) français. " +
  "Tu réponds toujours en français, de façon concise et professionnelle, sans inventer d'information " +
  "qui ne figure pas dans le contexte fourni.";

export type ContactSummaryInput = {
  firstName: string;
  lastName: string;
  status: keyof typeof contactStatusLabels;
  company: string | null;
  potential: number | null;
  source: string | null;
  notes: string | null;
  wealthNet: number;
  openOpportunities: { title: string; stage: keyof typeof opportunityStageLabels; amount: number | null }[];
  recentActivities: { label: string; createdAt: Date }[];
};

export function buildContactSummaryPrompt(contact: ContactSummaryInput): { system: string; prompt: string } {
  const lines = [
    `Client : ${contact.firstName} ${contact.lastName}`,
    `Statut : ${contactStatusLabels[contact.status]}`,
    `Société : ${contact.company ?? "—"}`,
    `Potentiel estimé : ${formatCurrency(contact.potential)}`,
    `Source : ${contact.source ?? "—"}`,
    `Patrimoine net connu : ${formatCurrency(contact.wealthNet)}`,
    `Notes générales : ${contact.notes ?? "—"}`,
    "",
    "Opportunités en cours :",
    ...(contact.openOpportunities.length === 0
      ? ["Aucune"]
      : contact.openOpportunities.map(
          (o) => `- ${o.title} (${opportunityStageLabels[o.stage]}, ${formatCurrency(o.amount)})`,
        )),
    "",
    "Dernières activités :",
    ...(contact.recentActivities.length === 0
      ? ["Aucune"]
      : contact.recentActivities.map((a) => `- ${formatDate(a.createdAt)} : ${a.label}`)),
  ];

  return {
    system: SYSTEM_PERSONA,
    prompt:
      "Rédige un résumé du client ci-dessous en 3 à 5 puces courtes, à destination du conseiller " +
      "(situation, opportunités en cours, point d'attention éventuel). Pas d'introduction, pas de conclusion.\n\n" +
      lines.join("\n"),
  };
}

export type FollowUpInput = {
  firstName: string;
  lastName: string;
  status: keyof typeof contactStatusLabels;
  nextAction: string | null;
  nextContactAt: Date | null;
  lastActivity: { label: string; createdAt: Date } | null;
  openOpportunities: { title: string; stage: keyof typeof opportunityStageLabels }[];
};

export function buildFollowUpPrompt(contact: FollowUpInput): { system: string; prompt: string } {
  const lines = [
    `Client : ${contact.firstName} ${contact.lastName}`,
    `Statut : ${contactStatusLabels[contact.status]}`,
    `Prochaine action prévue : ${contact.nextAction ?? "—"}${contact.nextContactAt ? ` (${formatDate(contact.nextContactAt)})` : ""}`,
    `Dernière activité : ${contact.lastActivity ? `${contact.lastActivity.label} (${formatDate(contact.lastActivity.createdAt)})` : "Aucune"}`,
    "Opportunités en cours :",
    ...(contact.openOpportunities.length === 0
      ? ["Aucune"]
      : contact.openOpportunities.map((o) => `- ${o.title} (${opportunityStageLabels[o.stage]})`)),
  ];

  return {
    system: SYSTEM_PERSONA,
    prompt:
      "Rédige un court message de relance (email) à envoyer à ce client par son conseiller, en te basant " +
      "uniquement sur les informations ci-dessous. Ton professionnel et chaleureux, 4 à 6 phrases, " +
      "avec un objet d'email en première ligne (préfixé par « Objet : »).\n\n" +
      lines.join("\n"),
  };
}

export type OpportunityAnalysisInput = {
  title: string;
  category: keyof typeof opportunityCategoryLabels;
  stage: keyof typeof opportunityStageLabels;
  amount: number | null;
  probability: number;
  note: string | null;
  contactFirstName: string;
  contactLastName: string;
  contactPotential: number | null;
  wealthNet: number;
};

export function buildOpportunityAnalysisPrompt(opportunity: OpportunityAnalysisInput): {
  system: string;
  prompt: string;
} {
  const lines = [
    `Opportunité : ${opportunity.title}`,
    `Catégorie : ${opportunityCategoryLabels[opportunity.category]}`,
    `Étape : ${opportunityStageLabels[opportunity.stage]}`,
    `Montant : ${formatCurrency(opportunity.amount)}`,
    `Probabilité : ${opportunity.probability}%`,
    `Note : ${opportunity.note ?? "—"}`,
    `Client : ${opportunity.contactFirstName} ${opportunity.contactLastName}`,
    `Potentiel estimé du client : ${formatCurrency(opportunity.contactPotential)}`,
    `Patrimoine net connu du client : ${formatCurrency(opportunity.wealthNet)}`,
  ];

  return {
    system: SYSTEM_PERSONA,
    prompt:
      "Analyse cette opportunité commerciale pour le conseiller : évalue en une phrase la probabilité " +
      "réaliste de conclusion, identifie un risque ou point de vigilance, et propose une prochaine étape " +
      "concrète. Réponds en 3 puces courtes maximum.\n\n" +
      lines.join("\n"),
  };
}

export type MeetingSummaryInput = {
  contactFirstName: string;
  contactLastName: string;
  date: Date;
  objectives: string | null;
  recommendations: string | null;
  notes: string | null;
};

export function buildMeetingSummaryPrompt(meeting: MeetingSummaryInput): { system: string; prompt: string } {
  const lines = [
    `Client : ${meeting.contactFirstName} ${meeting.contactLastName}`,
    `Date de l'entretien : ${formatDate(meeting.date)}`,
    `Objectifs exprimés par le client : ${meeting.objectives ?? "—"}`,
    `Préconisations du conseiller : ${meeting.recommendations ?? "—"}`,
    `Notes complémentaires : ${meeting.notes ?? "—"}`,
  ];

  return {
    system: SYSTEM_PERSONA,
    prompt:
      "Rédige un compte-rendu d'entretien destiné à être envoyé directement au client, à partir des " +
      "informations ci-dessous uniquement. Structure-le en deux parties avec des titres courts : " +
      "« Ce que nous avons évoqué » (reprend les objectifs exprimés) et « Nos préconisations » " +
      "(reprend les recommandations). Ton professionnel, clair, sans jargon technique, adapté à un client. " +
      "Si les objectifs ou les préconisations ne sont pas renseignés, dis-le sobrement plutôt que d'inventer. " +
      "Pas de formule de politesse d'ouverture ni de signature.\n\n" +
      lines.join("\n"),
  };
}

export function buildNewsletterPrompt(): { system: string; prompt: string } {
  return {
    system: SYSTEM_PERSONA,
    prompt:
      "Cherche sur le web l'actualité financière, fiscale et sociale récente (derniers jours) " +
      "susceptible d'intéresser des clients TNS, professions libérales et dirigeants de petites " +
      "entreprises d'un CGP français. Rédige ensuite une courte newsletter à partir de ce que tu as " +
      "trouvé : un titre, puis 3 à 4 actualités, chacune avec un titre court, 2 à 3 phrases " +
      "d'explication simple (sans jargon), et une phrase sur l'impact concret pour ce public. Cite " +
      "uniquement des informations trouvées par la recherche web, sans inventer de chiffres ni de " +
      "dates. Termine par une ligne indiquant la date du jour de génération.",
  };
}

export type OpportunitySuggestionsInput = {
  firstName: string;
  lastName: string;
  status: keyof typeof contactStatusLabels;
  profession: string | null;
  maritalStatus: keyof typeof maritalStatusLabels | null;
  potential: number | null;
  wealthNet: number;
  wealthCategories: string[];
  subscribedProducts: string[];
  availableProducts: string[];
  openOpportunityTitles: string[];
};

export function buildOpportunitySuggestionsPrompt(contact: OpportunitySuggestionsInput): {
  system: string;
  prompt: string;
} {
  const lines = [
    `Client : ${contact.firstName} ${contact.lastName}`,
    `Statut : ${contactStatusLabels[contact.status]}`,
    `Profession : ${contact.profession ?? "—"}`,
    `Situation familiale : ${contact.maritalStatus ? maritalStatusLabels[contact.maritalStatus] : "—"}`,
    `Potentiel estimé : ${formatCurrency(contact.potential)}`,
    `Patrimoine net connu : ${formatCurrency(contact.wealthNet)}`,
    `Catégories de patrimoine détenues : ${
      contact.wealthCategories.length > 0 ? contact.wealthCategories.join(", ") : "Aucune connue"
    }`,
    "",
    "Produits déjà souscrits par ce client :",
    ...(contact.subscribedProducts.length === 0 ? ["Aucun"] : contact.subscribedProducts.map((p) => `- ${p}`)),
    "",
    "Produits du catalogue non souscrits par ce client :",
    ...(contact.availableProducts.length === 0
      ? ["Aucun"]
      : contact.availableProducts.map((p) => `- ${p}`)),
    "",
    "Opportunités commerciales déjà ouvertes (ne jamais les dupliquer) :",
    ...(contact.openOpportunityTitles.length === 0
      ? ["Aucune"]
      : contact.openOpportunityTitles.map((t) => `- ${t}`)),
  ];

  return {
    system: SYSTEM_PERSONA,
    prompt:
      "À partir du profil du client ci-dessous, propose 2 à 3 pistes commerciales concrètes et réalistes : " +
      "des produits du catalogue non encore souscrits, en expliquant en une phrase pourquoi chacun est " +
      "pertinent pour ce profil précis. Ne propose jamais un produit déjà souscrit ni une opportunité déjà " +
      "ouverte. Si aucune piste sérieuse ne se dégage des informations disponibles, dis-le simplement plutôt " +
      "que d'inventer. Réponds en liste à puces courtes, sans introduction ni conclusion.\n\n" +
      lines.join("\n"),
  };
}
