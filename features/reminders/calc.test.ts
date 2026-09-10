import { describe, expect, it } from "vitest";
import { daysUntil, monthDayLabel, nextOccurrence, upcomingReminders } from "./calc";

describe("nextOccurrence", () => {
  it("returns this year's date when it hasn't passed yet", () => {
    const now = new Date("2026-01-10");
    const result = nextOccurrence({ id: "1", label: "PER", month: 12, day: 31 }, now);
    expect(result).toEqual(new Date(2026, 11, 31));
  });

  it("rolls over to next year when the date already passed", () => {
    const now = new Date("2026-12-31");
    const result = nextOccurrence({ id: "1", label: "PER", month: 1, day: 15 }, now);
    expect(result).toEqual(new Date(2027, 0, 15));
  });

  it("treats today as not yet passed", () => {
    const now = new Date("2026-06-15");
    const result = nextOccurrence({ id: "1", label: "X", month: 6, day: 15 }, now);
    expect(result).toEqual(new Date(2026, 5, 15));
  });
});

describe("daysUntil", () => {
  it("computes the day difference, ignoring time of day", () => {
    const now = new Date("2026-06-01T18:30:00");
    expect(daysUntil(new Date("2026-06-11T00:00:00"), now)).toBe(10);
  });
});

describe("monthDayLabel", () => {
  it("formats a month/day pair in French", () => {
    expect(monthDayLabel(12, 31)).toBe("31 décembre");
    expect(monthDayLabel(1, 1)).toBe("1 janvier");
  });
});

describe("upcomingReminders", () => {
  it("sorts reminders by proximity, nearest first", () => {
    const now = new Date("2026-06-01");
    const reminders = [
      { id: "1", label: "Loin", month: 12, day: 31 },
      { id: "2", label: "Proche", month: 6, day: 5 },
      { id: "3", label: "Moyen", month: 8, day: 1 },
    ];
    const result = upcomingReminders(reminders, now);
    expect(result.map((r) => r.label)).toEqual(["Proche", "Moyen", "Loin"]);
    expect(result[0].daysUntil).toBe(4);
  });
});
