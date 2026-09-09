import { describe, expect, it } from "vitest";
import {
  buildContactSummaryPrompt,
  buildFollowUpPrompt,
  buildOpportunityAnalysisPrompt,
} from "./prompts";

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
