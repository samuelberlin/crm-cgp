"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { updateTask, type TaskFormState } from "./actions";
import { taskPriorityLabels, taskPriorityValues, taskStatusLabels, taskStatusValues } from "./schemas";

const initialState: TaskFormState = null;

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function EditTaskForm({
  task,
}: {
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate: Date | null;
    contactId: string | null;
    opportunityId: string | null;
  };
}) {
  const action = updateTask.bind(null, task.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="contactId" value={task.contactId ?? ""} />
      <input type="hidden" name="opportunityId" value={task.opportunityId ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" defaultValue={task.title} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <NativeSelect id="priority" name="priority" defaultValue={task.priority}>
            {taskPriorityValues.map((value) => (
              <option key={value} value={value}>
                {taskPriorityLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <NativeSelect id="status" name="status" defaultValue={task.status}>
            {taskStatusValues.map((value) => (
              <option key={value} value={value}>
                {taskStatusLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Échéance</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(task.dueDate)} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
