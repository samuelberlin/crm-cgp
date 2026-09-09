import type { TaskStatus } from "@/lib/generated/prisma/enums";

export const taskViewValues = ["today", "week", "late", "all"] as const;
export type TaskView = (typeof taskViewValues)[number];

export const taskViewLabels: Record<TaskView, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  late: "En retard",
  all: "Toutes",
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const NOT_DONE: TaskStatus = "TERMINEE";

/**
 * Prisma-compatible `where` fragment for a task view. Pure and testable:
 * pass a fixed `now` to avoid depending on the real clock.
 */
export function taskViewWhere(view: TaskView, now: Date = new Date()) {
  const today0 = startOfDay(now);

  switch (view) {
    case "today":
      return { status: { not: NOT_DONE }, dueDate: { gte: today0, lte: endOfDay(now) } };
    case "week": {
      const weekEnd = endOfDay(new Date(today0.getTime() + 6 * 24 * 60 * 60 * 1000));
      return { status: { not: NOT_DONE }, dueDate: { gte: today0, lte: weekEnd } };
    }
    case "late":
      return { status: { not: NOT_DONE }, dueDate: { lt: today0 } };
    case "all":
    default:
      return {};
  }
}
