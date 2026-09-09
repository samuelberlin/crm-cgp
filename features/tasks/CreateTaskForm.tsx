"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createTask, type TaskFormState } from "./actions";
import { taskPriorityLabels, taskPriorityValues } from "./schemas";

const initialState: TaskFormState = null;

export function CreateTaskForm({
  contacts,
  lockedContact,
}: {
  contacts: { id: string; firstName: string; lastName: string }[];
  lockedContact?: { id: string; firstName: string; lastName: string };
}) {
  const [state, formAction, isPending] = useActionState(createTask, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" required autoFocus />
      </div>

      {lockedContact ? (
        <div className="space-y-2">
          <Label>Contact</Label>
          <p className="text-sm font-medium">
            {lockedContact.firstName} {lockedContact.lastName}
          </p>
          <input type="hidden" name="contactId" value={lockedContact.id} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="contactId">Contact (optionnel)</Label>
          <NativeSelect id="contactId" name="contactId" defaultValue="">
            <option value="">Aucun</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <NativeSelect id="priority" name="priority" defaultValue="NORMALE">
            {taskPriorityValues.map((value) => (
              <option key={value} value={value}>
                {taskPriorityLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Échéance</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Création…" : "Créer la tâche"}
      </Button>
    </form>
  );
}
