export function lastTouchDate(contact: { lastContactAt: Date | null; createdAt: Date }): Date {
  return contact.lastContactAt ?? contact.createdAt;
}

export function daysSince(date: Date, now: Date = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

/** A contact is "inactive" once nothing has happened for at least `thresholdDays`. */
export function isInactive(
  contact: { lastContactAt: Date | null; createdAt: Date },
  thresholdDays: number,
  now: Date = new Date(),
): boolean {
  return daysSince(lastTouchDate(contact), now) >= thresholdDays;
}
