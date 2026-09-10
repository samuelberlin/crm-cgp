/** Lundi (00:00) de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = dimanche, 1 = lundi, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Les 7 jours (lundi -> dimanche) de la semaine commençant `monday`. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const WEEK_RANGE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const WEEK_RANGE_FORMATTER_WITH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function weekdayShortLabel(date: Date): string {
  const label = WEEKDAY_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

/** Ex. "5 - 11 janvier 2026" (ou "29 déc. - 4 janv. 2026" si la semaine chevauche deux mois). */
export function weekRangeLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear();
  if (sameMonth) {
    return `${monday.getDate()} - ${WEEK_RANGE_FORMATTER_WITH_YEAR.format(sunday)}`;
  }
  return `${WEEK_RANGE_FORMATTER.format(monday)} - ${WEEK_RANGE_FORMATTER_WITH_YEAR.format(sunday)}`;
}

/** "YYYY-MM-DD", pour le paramètre d'URL ?week=. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Plage d'heures à afficher sur la grille : une amplitude confortable par défaut (8h-20h),
 * élargie si besoin pour ne jamais couper un rendez-vous existant en dehors de cette plage.
 */
export function hourRange(
  meetingHours: number[],
  defaultStart = 8,
  defaultEnd = 20,
): { startHour: number; endHour: number } {
  if (meetingHours.length === 0) return { startHour: defaultStart, endHour: defaultEnd };
  const earliest = Math.min(defaultStart, ...meetingHours);
  const latest = Math.max(defaultEnd, ...meetingHours.map((h) => h + 1));
  return { startHour: Math.max(0, earliest), endHour: Math.min(24, latest) };
}

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
};

export type PositionedEvent = {
  id: string;
  column: number;
  columnCount: number;
};

/**
 * Place les événements qui se chevauchent côte à côte (comme Outlook/Google Agenda) :
 * chaque groupe d'événements mutuellement chevauchants ("cluster") se voit attribuer
 * autant de colonnes que son maximum de recouvrements simultanés.
 */
export function layoutOverlappingEvents(events: CalendarEvent[]): PositionedEvent[] {
  const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: PositionedEvent[] = [];

  let cluster: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const columnCount = columnEnds.length;
    for (const e of cluster) result.push({ id: e.id, column: e.column, columnCount });
    cluster = [];
    columnEnds = [];
  };

  for (const event of sorted) {
    if (event.start.getTime() >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }

    let column = columnEnds.findIndex((end) => end <= event.start.getTime());
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(event.end.getTime());
    } else {
      columnEnds[column] = event.end.getTime();
    }

    cluster.push({ id: event.id, column });
    clusterEnd = Math.max(clusterEnd, event.end.getTime());
  }
  flush();

  return result;
}
