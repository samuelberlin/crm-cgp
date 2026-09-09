import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/features/auth/session";
import { taskWhere } from "@/features/tasks/access";
import { StatusSelect } from "@/features/tasks/StatusSelect";
import { taskPriorityLabels } from "@/features/tasks/schemas";
import { taskViewLabels, taskViewValues, taskViewWhere, type TaskView } from "@/features/tasks/views";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireUser();
  const { view: rawView } = await searchParams;
  const view: TaskView = (taskViewValues as readonly string[]).includes(rawView ?? "")
    ? (rawView as TaskView)
    : "all";

  const tasks = await prisma.task.findMany({
    where: { ...taskWhere(session.user), ...taskViewWhere(view) },
    include: { contact: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold">Tâches</h1>
        <Link href="/tasks/new" className={buttonVariants()}>
          Nouvelle tâche
        </Link>
      </div>

      <div className="mb-4 flex gap-1">
        {taskViewValues.map((value) => (
          <Link
            key={value}
            href={`/tasks?view=${value}`}
            className={buttonVariants({ variant: value === view ? "default" : "outline", size: "sm" })}
          >
            {taskViewLabels[value]}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Link href={`/tasks/${task.id}/edit`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {task.contact ? (
                    <Link href={`/contacts/${task.contact.id}`} className="hover:underline">
                      {task.contact.firstName} {task.contact.lastName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={task.priority === "HAUTE" ? "destructive" : "outline"}>
                    {taskPriorityLabels[task.priority]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(task.dueDate)}</TableCell>
                <TableCell>
                  <StatusSelect taskId={task.id} status={task.status} />
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Aucune tâche.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
