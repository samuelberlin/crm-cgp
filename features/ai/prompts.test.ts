import { describe, expect, it } from "vitest";
import {
  buildContactSummaryPrompt,
  buildFollowUpPrompt,
  buildMeetingSummaryPrompt,
  buildNewsletterPrompt,
  buildOpportunityAnalysisPrompt,
  buildOpportunitySuggestionsPrompt,
  buildWealthAnalysisPrompt,
} from "./prompts";

describe("buildNewsletterPrompt", () => {
  it("instructs the model to search the web and target TNS/prof lib/dirigeants", () => {
    const { prompt, system } = buildNewsletterPrompt();

    expect(system).toContain("CGP");
    expect(prompt).toContain("web");
    expect(prompt).toContain("TNS");
    expect(prompt).toContain("professions libérales");
    expect(prompt).toContain("dirigeants");
  });
});

describe("buildContactSummaryPrompt", () => {
  it("includes the client's key facts", () => {
    const { prompt, system } = buildContactSummaryPrompt({
      firstName: "Marc",
      lastName: "Petit",
      status: "CLIENT",
      company: "Petit SARL",
      potential: 50000,
      source: "Recommandation",
      notes: "Souhaite investir avant décembre.",
      wealthNet: 120000,
      openOpportunities: [{ title: "PER Marc", stage: "PROPOSITION", amount: 30000 }],
      recentActivities: [{ label: "Rendez-vous réalisé", createdAt: new Date("2026-01-05") }],
    });

    expect(system).toContain("CGP");
    expect(prompt).toContain("Marc Petit");
    expect(prompt).toContain("Petit SARL");
    expect(prompt).toContain("PER Marc");
    expect(prompt).toContain("Rendez-vous réalisé");
  });

  it("renders empty lists explicitly rather than an empty section", () => {
    const { prompt } = buildContactSummaryPrompt({
      firstName: "Alice",
      lastName: "Nouvel",
      status: "PROSPECT",
      company: null,
      potential: null,
      source: null,
      notes: null,
      wealthNet: 0,
      openOpportunities: [],
      recentActivities: [],
    });

    expect(prompt).toContain("Opportunités en cours :\nAucune");
    expect(prompt).toContain("Dernières activités :\nAucune");
  });
});

describe("buildFollowUpPrompt", () => {
  it("includes the next action and open opportunities", () => {
    const { prompt } = buildFollowUpPrompt({
      firstName: "Marc",
      lastName: "Petit",
      status: "CLIENT",
      nextAction: "Envoyer la proposition",
      nextContactAt: new Date("2026-02-01"),
      lastActivity: { label: "Rendez-vous réalisé", createdAt: new Date("2026-01-05") },
      openOpportunities: [{ title: "PER Marc", stage: "PROPOSITION" }],
    });

    expect(prompt).toContain("Envoyer la proposition");
    expect(prompt).toContain("PER Marc");
    expect(prompt).toContain("Objet");
  });
});

describe("buildMeetingSummaryPrompt", () => {
  it("includes the client, date, objectives, and recommendations", () => {
    const { prompt } = buildMeetingSummaryPrompt({
      contactFirstName: "Marc",
      contactLastName: "Petit",
      date: new Date("2026-01-05"),
      objectives: "Préparer sa retraite dans de bonnes conditions.",
      recommendations: "Ouvrir un PER avec versement initial de 10 000 €.",
      notes: "Client très motivé.",
    });

    expect(prompt).toContain("Marc Petit");
    expect(prompt).toContain("Préparer sa retraite");
    expect(prompt).toContain("Ouvrir un PER");
    expect(prompt).toContain("Ce que nous avons évoqué");
    expect(prompt).toContain("Nos préconisations");
  });

  it("says so plainly rather than inventing when objectives or recommendations are missing", () => {
    const { prompt } = buildMeetingSummaryPrompt({
      contactFirstName: "Alice",
      contactLastName: "Nouvel",
      date: new Date("2026-01-05"),
      objectives: null,
      recommendations: null,
      notes: null,
    });

    expect(prompt).toContain("Objectifs exprimés par le client : —");
    expect(prompt).toContain("Préconisations du conseiller : —");
  });
});

describe("buildOpportunityAnalysisPrompt", () => {
  it("includes the opportunity and client context", () => {
    const { prompt } = buildOpportunityAnalysisPrompt({
      title: "PER Marc",
      category: "RETRAITE",
      stage: "PROPOSITION",
      amount: 30000,
      probability: 60,
      note: "Client hésitant sur le montant.",
      contactFirstName: "Marc",
      contactLastName: "Petit",
      contactPotential: 50000,
      wealthNet: 120000,
    });

    expect(prompt).toContain("PER Marc");
    expect(prompt).toContain("Retraite");
    expect(prompt).toContain("60%");
    expect(prompt).toContain("Marc Petit");
  });
});

describe("buildOpportunitySuggestionsPrompt", () => {
  it("includes the client profile, holdings, and gaps", () => {
    const { prompt } = buildOpportunitySuggestionsPrompt({
      firstName: "Marc",
      lastName: "Petit",
      status: "CLIENT",
      profession: "Artisan",
      maritalStatus: "MARIE",
      potential: 50000,
      wealthNet: 120000,
      wealthCategories: ["Immobilier", "Financier"],
      subscribedProducts: ["SwissLife Prévoyance TNS"],
      availableProducts: ["SwissLife PER Individuel", "SwissLife Retraite"],
      openOpportunityTitles: ["PER Marc"],
    });

    expect(prompt).toContain("Marc Petit");
    expect(prompt).toContain("Marié(e)");
    expect(prompt).toContain("Artisan");
    expect(prompt).toContain("Immobilier, Financier");
    expect(prompt).toContain("SwissLife Prévoyance TNS");
    expect(prompt).toContain("SwissLife PER Individuel");
    expect(prompt).toContain("PER Marc");
  });

  it("renders empty lists explicitly rather than an empty section", () => {
    const { prompt } = buildOpportunitySuggestionsPrompt({
      firstName: "Alice",
      lastName: "Nouvel",
      status: "PROSPECT",
      profession: null,
      maritalStatus: null,
      potential: null,
      wealthNet: 0,
      wealthCategories: [],
      subscribedProducts: [],
      availableProducts: [],
      openOpportunityTitles: [],
    });

    expect(prompt).toContain("Aucune connue");
    expect(prompt).toContain("Produits déjà souscrits par ce client :\nAucun");
    expect(prompt).toContain("Opportunités commerciales déjà ouvertes (ne jamais les dupliquer) :\nAucune");
  });
});

describe("buildWealthAnalysisPrompt", () => {
  it("positions the model as a wealth management expert and includes income, wealth, and notes", () => {
    const { system, prompt } = buildWealthAnalysisPrompt({
      firstName: "Marc",
      lastName: "Gérant",
      status: "CLIENT",
      cspCategory: "DIRIGEANT",
      profession: "Consultant",
      legalForm: "SASU",
      maritalStatus: "MARIE",
      birthDate: new Date("1980-05-12"),
      generalNotes: "Souhaite préparer sa transmission.",
      detailedNotes: [{ content: "Veut protéger son conjoint en cas de décès.", createdAt: new Date("2026-01-05") }],
      incomeItems: [{ category: "REMUNERATION_ART_62", label: null, amount: 40000 }],
      incomeTotal: 40000,
      assets: [{ category: "IMMOBILIER", label: "SCI familiale", amount: 200000 }],
      liabilities: [{ category: "CREDIT", label: null, amount: 50000 }],
      wealthNet: 150000,
      subscribedProducts: ["SwissLife PER Individuel"],
    });

    expect(system).toContain("expert");
    expect(system).toContain("gestion de patrimoine");
    expect(prompt).toContain("Marc Gérant");
    expect(prompt).toContain("Dirigeant / Chef d'entreprise");
    expect(prompt).toContain("SASU");
    expect(prompt).toContain("Rémunération art. 62");
    expect(prompt).toContain("SCI familiale");
    expect(prompt).toContain("Veut protéger son conjoint en cas de décès.");
    expect(prompt).toContain("SwissLife PER Individuel");
    expect(prompt).toContain("Besoins et objectifs identifiés");
    expect(prompt).toContain("Diagnostic patrimonial");
    expect(prompt).toContain("Recommandations");
  });

  it("renders empty sections explicitly rather than inventing content", () => {
    const { prompt } = buildWealthAnalysisPrompt({
      firstName: "Alice",
      lastName: "Nouvel",
      status: "PROSPECT",
      cspCategory: null,
      profession: null,
      legalForm: null,
      maritalStatus: null,
      birthDate: null,
      generalNotes: null,
      detailedNotes: [],
      incomeItems: [],
      incomeTotal: 0,
      assets: [],
      liabilities: [],
      wealthNet: 0,
      subscribedProducts: [],
    });

    expect(prompt).toContain("Aucun revenu renseigné");
    expect(prompt).toContain("Aucun actif renseigné");
    expect(prompt).toContain("Aucun passif renseigné");
    expect(prompt).toContain("Notes du conseiller (besoins, objectifs, commentaires sur le client) :\nAucune note");
  });
});
