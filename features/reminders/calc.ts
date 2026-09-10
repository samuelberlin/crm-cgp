export type FiscalReminderLike = {
  id: string;
  label: string;
  month: number; // 1-12
  day: number; // 1-31
};

export type UpcomingReminder = FiscalReminderLike & {
  nextDate: Date;
  daysUntil: number;
};

/** Prochaine occurrence (cette année si pas encore passée, sinon l'an prochain). */
export function nextOccurrence(reminder: FiscalReminderLike, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let candidate = new Date(now.getFullYear(), reminder.month - 1, reminder.day);
  if (candidate < today) {
    candidate = new Date(now.getFullYear() + 1, reminder.month - 1, reminder.day);
  }
  return candidate;
}

export function daysUntil(date: Date, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function monthDayLabel(month: number, day: number): string {
  return `${day} ${MONTH_LABELS[month - 1]}`;
}

/** Trie les rappels par proximité (le plus proche d'abord). */
export function upcomingReminders(reminders: FiscalReminderLike[], now: Date): UpcomingReminder[] {
  return reminders
    .map((reminder) => {
      const nextDate = nextOccurrence(reminder, now);
      return { ...reminder, nextDate, daysUntil: daysUntil(nextDate, now) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
