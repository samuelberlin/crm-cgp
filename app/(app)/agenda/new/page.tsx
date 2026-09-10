import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { contactWhere } from "@/features/contacts/access";
import { CreateMeetingForm } from "@/features/agenda/CreateMeetingForm";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const session = await requireUser();
  const { contactId } = await searchParams;

  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...contactWhere(session.user) },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!contact) notFound();

    return (
      <div className="max-w-lg">
        <h1 className="mb-6 text-3xl font-semibold">Nouveau rendez-vous</h1>
        <Card>
          <CardHeader>
            <CardTitle>
              Pour {contact.firstName} {contact.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateMeetingForm contacts={[]} lockedContact={contact} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const contacts = await prisma.contact.findMany({
    where: contactWhere(session.user),
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-3xl font-semibold">Nouveau rendez-vous</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateMeetingForm contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  );
}
