import Link from "next/link";
import { formatTime } from "@/lib/format";
import {
  hourRange,
  isSameDay,
  layoutOverlappingEvents,
  weekDays,
  weekdayShortLabel,
  type CalendarEvent,
} from "./calendarLayout";
import type { meetingStatusValues } from "./schemas";

const HOUR_PX = 56;

type CalendarMeeting = {
  id: string;
  date: Date;
  location: string | null;
  status: (typeof meetingStatusValues)[number];
  contact: { id: string; firstName: string; lastName: string };
};

const STATUS_STYLES: Record<(typeof meetingStatusValues)[number], string> = {
  PLANIFIE:
    "border-blue-400 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-100 dark:hover:bg-blue-950",
  REALISE:
    "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-950",
  ANNULE:
    "border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted/70 line-through decoration-muted-foreground/50",
};

export function WeekCalendar({ monday, meetings }: { monday: Date; meetings: CalendarMeeting[] }) {
  const days = weekDays(monday);
  const now = new Date();

  // Inclut l'heure actuelle dans la plage affichée quand la semaine en cours est visible,
  // pour que le repère "maintenant" soit toujours visible, pas seulement entre 8h et 20h.
  const isCurrentWeekVisible = days.some((day) => isSameDay(day, now));
  const relevantHours = meetings.map((m) => m.date.getHours());
  if (isCurrentWeekVisible) relevantHours.push(now.getHours());

  const { startHour, endHour } = hourRange(relevantHours);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalHeight = hours.length * HOUR_PX;

  const eventsByDay = days.map((day) => {
    const dayMeetings = meetings.filter((m) => isSameDay(m.date, day));
    const events: CalendarEvent[] = dayMeetings.map((m) => ({
      id: m.id,
      start: m.date,
      end: new Date(m.date.getTime() + 60 * 60_000),
    }));
    const positions = new Map(layoutOverlappingEvents(events).map((p) => [p.id, p]));
    return { day, meetings: dayMeetings, positions };
  });

  const todayIndex = days.findIndex((d) => isSameDay(d, now));
  const nowOffset = ((now.getHours() - startHour) * 60 + now.getMinutes()) / 60;
  const showNowLine = todayIndex !== -1 && nowOffset >= 0 && nowOffset <= hours.length;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="grid min-w-[720px] grid-cols-[3.5rem_repeat(7,1fr)]">
        <div className="border-b" />
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className={`border-b border-l px-2 py-2 text-center text-sm ${isToday ? "bg-primary/5" : ""}`}
            >
              <div className="text-xs text-muted-foreground">{weekdayShortLabel(day)}</div>
              <div
                className={`mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full font-medium ${
                  isToday ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}

        <div className="relative" style={{ height: totalHeight }}>
          {hours.map((hour, i) => (
            <div
              key={hour}
              className="absolute inset-x-0 pr-1 text-right text-xs text-muted-foreground"
              style={{ top: i * HOUR_PX - 6 }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {eventsByDay.map(({ day, meetings: dayMeetings, positions }, dayIndex) => (
          <div key={day.toISOString()} className="relative border-l" style={{ height: totalHeight }}>
            {hours.map((hour, i) => (
              <div key={hour} className="absolute inset-x-0 border-t" style={{ top: i * HOUR_PX }} />
            ))}

            {showNowLine && dayIndex === todayIndex && (
              <div
                className="absolute inset-x-0 z-10 border-t-2 border-red-500"
                style={{ top: nowOffset * HOUR_PX }}
              >
                <div className="-mt-1 -ml-0.5 size-2 rounded-full bg-red-500" />
              </div>
            )}

            {dayMeetings.map((meeting) => {
              const pos = positions.get(meeting.id);
              const column = pos?.column ?? 0;
              const columnCount = pos?.columnCount ?? 1;
              const top = ((meeting.date.getHours() - startHour) * 60 + meeting.date.getMinutes()) / 60;

              return (
                <Link
                  key={meeting.id}
                  href={`/agenda/${meeting.id}/edit`}
                  className={`absolute overflow-hidden rounded border px-1.5 py-1 text-xs leading-tight transition-colors ${STATUS_STYLES[meeting.status]}`}
                  style={{
                    top: top * HOUR_PX,
                    height: HOUR_PX - 2,
                    left: `${(column / columnCount) * 100}%`,
                    width: `calc(${100 / columnCount}% - 3px)`,
                  }}
                >
                  <div className="font-medium">{formatTime(meeting.date)}</div>
                  <div className="truncate">
                    {meeting.contact.firstName} {meeting.contact.lastName}
                  </div>
                  {meeting.location && <div className="truncate opacity-80">{meeting.location}</div>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
