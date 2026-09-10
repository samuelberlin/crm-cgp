import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKey,
  hourRange,
  isSameDay,
  layoutOverlappingEvents,
  startOfWeek,
  weekDays,
  weekRangeLabel,
  weekdayShortLabel,
} from "./calendarLayout";

describe("startOfWeek", () => {
  it("returns the Monday of the week for a midweek date", () => {
    // Mercredi 7 janvier 2026.
    const monday = startOfWeek(new Date(2026, 0, 7));
    expect(monday.getFullYear()).toBe(2026);
    expect(monday.getMonth()).toBe(0);
    expect(monday.getDate()).toBe(5);
  });

  it("treats a Sunday as the end of the previous week (Monday-first)", () => {
    // Dimanche 11 janvier 2026.
    const monday = startOfWeek(new Date(2026, 0, 11));
    expect(monday.getDate()).toBe(5);
  });

  it("is a no-op on a Monday", () => {
    const monday = startOfWeek(new Date(2026, 0, 5));
    expect(monday.getDate()).toBe(5);
  });
});

describe("addDays / weekDays", () => {
  it("adds days across a month boundary", () => {
    const d = addDays(new Date(2026, 0, 30), 3);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(2);
  });

  it("returns 7 consecutive days starting from Monday", () => {
    const monday = new Date(2026, 0, 5);
    const days = weekDays(monday);
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(5);
    expect(days[6].getDate()).toBe(11);
  });
});

describe("isSameDay", () => {
  it("compares calendar days, ignoring time", () => {
    expect(isSameDay(new Date(2026, 0, 5, 8, 0), new Date(2026, 0, 5, 23, 30))).toBe(true);
    expect(isSameDay(new Date(2026, 0, 5), new Date(2026, 0, 6))).toBe(false);
  });
});

describe("dateKey", () => {
  it("formats as YYYY-MM-DD, zero-padded", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(dateKey(new Date(2026, 10, 22))).toBe("2026-11-22");
  });
});

describe("weekRangeLabel", () => {
  it("formats a week within a single month", () => {
    expect(weekRangeLabel(new Date(2026, 0, 5))).toBe("5 - 11 janvier 2026");
  });

  it("formats a week spanning two months", () => {
    expect(weekRangeLabel(new Date(2025, 11, 29))).toMatch(/déc.*janv/i);
  });
});

describe("weekdayShortLabel", () => {
  it("capitalizes the short French weekday", () => {
    expect(weekdayShortLabel(new Date(2026, 0, 5))).toMatch(/^Lun/i);
  });
});

describe("hourRange", () => {
  it("defaults to 8h-20h when there are no meetings", () => {
    expect(hourRange([])).toEqual({ startHour: 8, endHour: 20 });
  });

  it("stays within the default range when meetings fit inside it", () => {
    expect(hourRange([9, 14])).toEqual({ startHour: 8, endHour: 20 });
  });

  it("expands to include an early or late meeting", () => {
    expect(hourRange([7, 21])).toEqual({ startHour: 7, endHour: 22 });
  });
});

describe("layoutOverlappingEvents", () => {
  function ev(id: string, startHour: number, startMinute: number, durationMinutes: number) {
    const start = new Date(2026, 0, 5, startHour, startMinute);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return { id, start, end };
  }

  it("gives every event a single column when nothing overlaps", () => {
    const result = layoutOverlappingEvents([ev("a", 9, 0, 60), ev("b", 11, 0, 60)]);
    expect(result).toEqual(
      expect.arrayContaining([
        { id: "a", column: 0, columnCount: 1 },
        { id: "b", column: 0, columnCount: 1 },
      ]),
    );
  });

  it("splits two overlapping events into two side-by-side columns", () => {
    const result = layoutOverlappingEvents([ev("a", 9, 0, 60), ev("b", 9, 30, 60)]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a.columnCount).toBe(2);
    expect(byId.b.columnCount).toBe(2);
    expect(byId.a.column).not.toBe(byId.b.column);
  });

  it("reuses a column once its event has ended", () => {
    const result = layoutOverlappingEvents([ev("a", 9, 0, 30), ev("b", 9, 30, 30)]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a.column).toBe(0);
    expect(byId.b.column).toBe(0);
    expect(byId.a.columnCount).toBe(1);
  });

  it("gives a 3-way overlap three columns", () => {
    const result = layoutOverlappingEvents([ev("a", 9, 0, 60), ev("b", 9, 15, 60), ev("c", 9, 30, 60)]);
    const columns = new Set(result.map((r) => r.column));
    expect(columns.size).toBe(3);
    expect(result.every((r) => r.columnCount === 3)).toBe(true);
  });
});
