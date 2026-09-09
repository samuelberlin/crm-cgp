import { describe, expect, it } from "vitest";
import { pickNextBestAction, type ContactCandidate, type TaskCandidate } from "./nextBestAction";

const NOW = new Date("2026-03-11T15:00:00.000Z");

function task(overrides: Partial<TaskCandidate> = {}): TaskCandidate {
  return {
    id: "t1",
    title: "Tâche",
    dueDate: NOW,
    priority: "NORMALE",
    contactId: null,
    contactName: null,
    ...overrides,
  };
}

function contact(overrides: Partial<ContactCandidate> = {}): ContactCandidate {
  return {
    id: "c1",
    name: "Contact",
    nextContactAt: NOW,
    nextAction: null,
    phone: null,
    email: null,
    potential: null,
    ...overrides,
  };
}

describe("pickNextBestAction", () => {
  it("returns 'none' when there is nothing actionable", () => {
    expect(pickNextBestAction([], [], NOW)).toEqual({ kind: "none" });
  });

  it("prioritizes an overdue task over everything else", () => {
    const overdueTask = task({ id: "late", dueDate: new Date("2026-03-08T10:00:00.000Z") });
    const todayTask = task({ id: "today", dueDate: NOW });
    const relance = contact({ nextContactAt: new Date("2026-03-01T00:00:00.000Z") });

    const result = pickNextBestAction([todayTask, overdueTask], [relance], NOW);
    expect(result).toMatchObject({ kind: "task", task: { id: "late" }, reason: "En retard de 3 jours" });
  });

  it("picks the earliest overdue task among several", () => {
    const earlier = task({ id: "earlier", dueDate: new Date("2026-03-08T10:00:00.000Z") });
    const later = task({ id: "later", dueDate: new Date("2026-03-10T10:00:00.000Z") });

    const result = pickNextBestAction([later, earlier], [], NOW);
    expect(result).toMatchObject({ kind: "task", task: { id: "earlier" } });
  });

  it("falls back to a task due today, preferring the highest priority", () => {
    const normal = task({ id: "normal", priority: "NORMALE", dueDate: NOW });
    const high = task({ id: "high", priority: "HAUTE", dueDate: NOW });

    const result = pickNextBestAction([normal, high], [], NOW);
    expect(result).toMatchObject({ kind: "task", task: { id: "high" }, reason: "À faire aujourd'hui" });
  });

  it("falls back to a due relance when there is no actionable task", () => {
    const futureTask = task({ dueDate: new Date("2026-03-15T00:00:00.000Z") });
    const dueRelance = contact({ id: "due", nextContactAt: new Date("2026-03-09T00:00:00.000Z") });
    const futureRelance = contact({ id: "future", nextContactAt: new Date("2026-03-20T00:00:00.000Z") });

    const result = pickNextBestAction([futureTask], [futureRelance, dueRelance], NOW);
    expect(result).toMatchObject({ kind: "relance", contact: { id: "due" } });
  });

  it("uses the contact's nextAction as the reason when set", () => {
    const dueRelance = contact({ nextContactAt: NOW, nextAction: "Envoyer la proposition" });
    const result = pickNextBestAction([], [dueRelance], NOW);
    expect(result).toMatchObject({ kind: "relance", reason: "Envoyer la proposition" });
  });
});
