import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { meetingWhere } from "@/features/agenda/access";
import { EditMeetingForm } from "@/features/agenda/EditMeetingForm";
import { generateMeetingSummary } from "@/features/ai/actions";
import { AiActionButton } from "@/features/ai/AiActionButton";

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const meeting = await prisma.meeting.findFirst({
    where: { id, ...meetingWhere(session.user) },
    include: { contact: true },
  });
  if (!meeting) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-3xl font-semibold">Modifier le rendez-vous</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {meeting.contact.firstName} {meeting.contact.lastName}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <EditMeetingForm meeting={meeting} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Résumé pour le client</CardTitle>
        </CardHeader>
        <CardContent>
          <AiActionButton
            label="Générer le résumé de l'entretien"
            pendingLabel="Génération…"
            action={generateMeetingSummary.bind(null, meeting.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
