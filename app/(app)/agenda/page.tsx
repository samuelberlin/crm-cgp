import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { meetingWhere } from "@/features/agenda/access";
import { StatusSelect } from "@/features/agenda/StatusSelect";

export default async function AgendaPage() {
  const session = await requireUser();
  const now = new Date();

  const meetings = await prisma.meeting.findMany({
    where: meetingWhere(session.user),
    include: { contact: true },
    orderBy: { date: "asc" },
  });

  const upcoming = meetings.filter((m) => m.date >= now);
  const past = meetings.filter((m) => m.date < now).reverse();

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-3xl font-semibold">Agenda</h1>
        <Link href="/agenda/new" className={buttonVariants()}>
          Nouveau rendez-vous
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>À venir</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingList meetings={upcoming} empty="Aucun rendez-vous à venir." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Passés</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingList meetings={past} empty="Aucun rendez-vous passé." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MeetingList({
  meetings,
  empty,
}: {
  meetings: Array<{
    id: string;
    date: Date;
    location: string | null;
    status: "PLANIFIE" | "REALISE" | "ANNULE";
    contact: { id: string; firstName: string; lastName: string };
  }>;
  empty: string;
}) {
  if (meetings.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {meetings.map((meeting) => (
        <li key={meeting.id} className="rounded-lg border p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/contacts/${meeting.contact.id}`} className="font-medium hover:underline">
                {meeting.contact.firstName} {meeting.contact.lastName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(meeting.date)}
                {meeting.location ? ` · ${meeting.location}` : ""}
              </p>
            </div>
            <StatusSelect meetingId={meeting.id} status={meeting.status} />
          </div>
          {meeting.status === "REALISE" && (
            <Link
              href={`/contacts/${meeting.contact.id}`}
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Ajouter un compte-rendu →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
