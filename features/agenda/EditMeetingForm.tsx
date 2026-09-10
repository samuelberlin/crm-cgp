"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateMeeting, type MeetingFormState } from "./actions";
import { meetingStatusLabels, meetingStatusValues } from "./schemas";

const initialState: MeetingFormState = null;

function toDateTimeInputValue(value: Date): string {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function EditMeetingForm({
  meeting,
}: {
  meeting: {
    id: string;
    date: Date;
    location: string | null;
    notes: string | null;
    objectives: string | null;
    recommendations: string | null;
    status: string;
  };
}) {
  const action = updateMeeting.bind(null, meeting.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date et heure</Label>
        <Input id="date" name="date" type="datetime-local" defaultValue={toDateTimeInputValue(meeting.date)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Lieu</Label>
        <Input id="location" name="location" defaultValue={meeting.location ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <NativeSelect id="status" name="status" defaultValue={meeting.status}>
          {meetingStatusValues.map((value) => (
            <option key={value} value={value}>
              {meetingStatusLabels[value]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="objectives">Objectifs du client</Label>
        <Textarea
          id="objectives"
          name="objectives"
          rows={3}
          defaultValue={meeting.objectives ?? ""}
          placeholder="Ce que le client souhaite aborder ou obtenir…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recommendations">Préconisations</Label>
        <Textarea
          id="recommendations"
          name="recommendations"
          rows={3}
          defaultValue={meeting.recommendations ?? ""}
          placeholder="Ce que vous préconisez suite à cet entretien…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={meeting.notes ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
