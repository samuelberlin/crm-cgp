"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAutomationSettings, type AutomationSettingsFormState } from "./actions";

const initialState: AutomationSettingsFormState = null;

export function AutomationSettingsForm({
  values,
}: {
  values: {
    firstContactDelayDays: number;
    meetingReportDelayDays: number;
    proposalFollowUpDelayDays: number;
    inactivityAlertDays: number;
  };
}) {
  const [state, formAction, isPending] = useActionState(updateAutomationSettings, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstContactDelayDays">Premier contact (jours après création d&apos;un prospect)</Label>
          <Input
            id="firstContactDelayDays"
            name="firstContactDelayDays"
            type="number"
            min="0"
            max="90"
            defaultValue={values.firstContactDelayDays}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingReportDelayDays">Compte rendu (jours après un rendez-vous réalisé)</Label>
          <Input
            id="meetingReportDelayDays"
            name="meetingReportDelayDays"
            type="number"
            min="0"
            max="90"
            defaultValue={values.meetingReportDelayDays}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposalFollowUpDelayDays">Relance (jours après l&apos;envoi d&apos;une proposition)</Label>
          <Input
            id="proposalFollowUpDelayDays"
            name="proposalFollowUpDelayDays"
            type="number"
            min="0"
            max="90"
            defaultValue={values.proposalFollowUpDelayDays}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inactivityAlertDays">Alerte inactivité (jours sans contact)</Label>
          <Input
            id="inactivityAlertDays"
            name="inactivityAlertDays"
            type="number"
            min="1"
            max="365"
            defaultValue={values.inactivityAlertDays}
          />
        </div>
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      {state && "success" in state && <p className="text-sm text-emerald-600">Paramètres enregistrés.</p>}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
