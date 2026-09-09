export type TaskCandidate = {
  id: string;
  title: string;
  dueDate: Date;
  priority: "HAUTE" | "NORMALE" | "BASSE";
  contactId: string | null;
  contactName: string | null;
};

export type ContactCandidate = {
  id: string;
  name: string;
  nextContactAt: Date;
  nextAction: string | null;
  phone: string | null;
  email: string | null;
  potential: number | null;
};

export type NextBestAction =
  | { kind: "task"; task: TaskCandidate; reason: string }
  | { kind: "relance"; contact: ContactCandidate; reason: string }
  | { kind: "none" };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const PRIORITY_RANK: Record<TaskCandidate["priority"], number> = { HAUTE: 2, NORMALE: 1, BASSE: 0 };

/**
 * Picks a single, always-available "next best action" from real data only:
 * an overdue task first, then a task due today, then a contact whose
 * planned follow-up date has arrived. Pure and testable — pass a fixed
 * `now` to avoid depending on the real clock.
 */
export function pickNextBestAction(
  tasks: TaskCandidate[],
  contacts: ContactCandidate[],
  now: Date = new Date(),
): NextBestAction {
  const today0 = startOfDay(now);
  const endToday = new Date(today0.getTime() + 24 * 60 * 60 * 1000 - 1);

  const overdue = [...tasks]
    .filter((t) => t.dueDate < today0)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  if (overdue.length > 0) {
    const task = overdue[0];
    const days = Math.round((today0.getTime() - startOfDay(task.dueDate).getTime()) / 86_400_000);
    return { kind: "task", task, reason: `En retard de ${days} jour${days > 1 ? "s" : ""}` };
  }

  const dueToday = [...tasks]
    .filter((t) => t.dueDate >= today0 && t.dueDate <= endToday)
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
  if (dueToday.length > 0) {
    return { kind: "task", task: dueToday[0], reason: "À faire aujourd'hui" };
  }

  const relances = [...contacts]
    .filter((c) => c.nextContactAt <= now)
    .sort((a, b) => a.nextContactAt.getTime() - b.nextContactAt.getTime());
  if (relances.length > 0) {
    const contact = relances[0];
    return { kind: "relance", contact, reason: contact.nextAction ?? "Relance prévue" };
  }

  return { kind: "none" };
}
