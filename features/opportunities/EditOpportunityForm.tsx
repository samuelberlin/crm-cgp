"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateOpportunity, type OpportunityFormState } from "./actions";
import {
  opportunityCategoryLabels,
  opportunityCategoryValues,
  opportunityStageLabels,
  opportunityStageValues,
} from "./schemas";

const initialState: OpportunityFormState = null;

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export function EditOpportunityForm({
  opportunity,
  advisors,
}: {
  opportunity: {
    id: string;
    title: string;
    category: string;
    amount: number | null;
    probability: number;
    stage: string;
    estimatedCloseDate: Date | null;
    note: string | null;
    nextAction: string | null;
    advisorId: string | null;
  };
  advisors: { id: string; name: string }[] | null;
}) {
  const action = updateOpportunity.bind(null, opportunity.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" defaultValue={opportunity.title} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <NativeSelect id="category" name="category" defaultValue={opportunity.category}>
            {opportunityCategoryValues.map((value) => (
              <option key={value} value={value}>
                {opportunityCategoryLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Étape</Label>
          <NativeSelect id="stage" name="stage" defaultValue={opportunity.stage}>
            {opportunityStageValues.map((value) => (
              <option key={value} value={value}>
                {opportunityStageLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Montant potentiel (€)</Label>
          <Input id="amount" name="amount" type="number" min="0" defaultValue={opportunity.amount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Probabilité (%)</Label>
          <Input
            id="probability"
            name="probability"
            type="number"
            min="0"
            max="100"
            defaultValue={opportunity.probability}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedCloseDate">Date estimée</Label>
          <Input
            id="estimatedCloseDate"
            name="estimatedCloseDate"
            type="date"
            defaultValue={toDateInputValue(opportunity.estimatedCloseDate)}
          />
        </div>
        {advisors && (
          <div className="space-y-2">
            <Label htmlFor="advisorId">Conseiller</Label>
            <NativeSelect id="advisorId" name="advisorId" defaultValue={opportunity.advisorId ?? ""}>
              <option value="">Non assigné</option>
              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextAction">Prochaine action</Label>
        <Input id="nextAction" name="nextAction" defaultValue={opportunity.nextAction ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" rows={3} defaultValue={opportunity.note ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
