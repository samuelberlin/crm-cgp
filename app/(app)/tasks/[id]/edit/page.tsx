import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/session";
import { taskWhere } from "@/features/tasks/access";
import { EditTaskForm } from "@/features/tasks/EditTaskForm";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  const task = await prisma.task.findFirst({ where: { id, ...taskWhere(session.user) } });
  if (!task) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Modifier la tâche</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <EditTaskForm task={task} />
        </CardContent>
      </Card>
    </div>
  );
}
