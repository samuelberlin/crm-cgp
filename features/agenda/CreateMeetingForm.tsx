"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createMeeting, type MeetingFormState } from "./actions";

const initialState: MeetingFormState = null;

export function CreateMeetingForm({
  contacts,
  lockedContact,
}: {
  contacts: { id: string; firstName: string; lastName: string }[];
  lockedContact?: { id: string; firstName: string; lastName: string };
}) {
  const [state, formAction, isPending] = useActionState(createMeeting, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          <Label htmlFor="contactId">Contact</Label>
          <NativeSelect id="contactId" name="contactId" required defaultValue="">
            <option value="" disabled>
              Sélectionner un contact
            </option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Date et heure</Label>
        <Input id="date" name="date" type="datetime-local" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input id="location" name="location" placeholder="Cabinet, visio…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="objectives">Objectifs du client</Label>
        <Textarea
          id="objectives"
          name="objectives"
          rows={3}
          placeholder="Ce que le client souhaite aborder ou obtenir…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Création…" : "Planifier le rendez-vous"}
      </Button>
    </form>
  );
}
