import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { NextBestAction } from "./nextBestAction";
import { TaskActionButtons } from "./TaskActionButtons";

export function NextActionCard({ action }: { action: NextBestAction }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ma prochaine meilleure action</CardTitle>
      </CardHeader>
      <CardContent>
        {action.kind === "none" && (
          <p className="text-sm text-muted-foreground">Rien d&apos;urgent aujourd&apos;hui. 🎉</p>
        )}

        {action.kind === "task" && (
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">{action.task.title}</p>
              <p className="text-sm text-muted-foreground">
                {action.reason}
                {action.task.contactName && ` · ${action.task.contactName}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TaskActionButtons taskId={action.task.id} />
              {action.task.contactId && (
                <Link
                  href={`/contacts/${action.task.contactId}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Voir le contact
                </Link>
              )}
            </div>
          </div>
        )}

        {action.kind === "relance" && (
          <div className="space-y-3">
            <div>
              <p className="text-lg font-medium">Contacter {action.contact.name}</p>
              <p className="text-sm text-muted-foreground">
                {action.reason}
                {action.contact.potential ? ` · Potentiel ${formatCurrency(action.contact.potential)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {action.contact.phone && (
                <a href={`tel:${action.contact.phone}`} className={buttonVariants({ size: "sm" })}>
                  Appeler
                </a>
              )}
              {action.contact.email && (
                <a
                  href={`mailto:${action.contact.email}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Email
                </a>
              )}
              <Link
                href={`/contacts/${action.contact.id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Voir le contact
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
