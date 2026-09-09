import { describe, expect, it } from "vitest";
import { taskViewWhere } from "./views";

// Wednesday, fixed reference point for deterministic tests.
const NOW = new Date("2026-03-11T15:00:00.000Z");

describe("taskViewWhere", () => {
  it("returns no filter for 'all'", () => {
    expect(taskViewWhere("all", NOW)).toEqual({});
  });

  it("excludes done tasks and keeps only today's due date for 'today'", () => {
    const where = taskViewWhere("today", NOW) as {
      status: { not: string };
      dueDate: { gte: Date; lte: Date };
    };
    expect(where.status.not).toBe("TERMINEE");
    expect(where.dueDate.gte.toISOString().slice(0, 10)).toBe("2026-03-11");
    expect(where.dueDate.lte.toISOString().slice(0, 10)).toBe("2026-03-11");
  });

  it("covers a 7-day rolling window for 'week'", () => {
    const where = taskViewWhere("week", NOW) as {
      dueDate: { gte: Date; lte: Date };
    };
    const days = Math.round(
      (where.dueDate.lte.getTime() - where.dueDate.gte.getTime()) / (24 * 60 * 60 * 1000),
    );
    expect(days).toBe(7);
  });

  it("only matches due dates strictly before today for 'late'", () => {
    const where = taskViewWhere("late", NOW) as { dueDate: { lt: Date } };
    expect(where.dueDate.lt.toISOString().slice(0, 10)).toBe("2026-03-11");
    expect(where.dueDate.lt.getHours()).toBe(0);
  });
});
