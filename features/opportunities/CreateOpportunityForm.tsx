"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createOpportunity, type OpportunityFormState } from "./actions";
import { opportunityCategoryLabels, opportunityCategoryValues } from "./schemas";

const initialState: OpportunityFormState = null;

export function CreateOpportunityForm({
  contacts,
  lockedContact,
}: {
  contacts: { id: string; firstName: string; lastName: string }[];
  lockedContact?: { id: string; firstName: string; lastName: string };
}) {
  const [state, formAction, isPending] = useActionState(createOpportunity, initialState);

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
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" required autoFocus={Boolean(lockedContact)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <NativeSelect id="category" name="category" defaultValue="AUTRE">
            {opportunityCategoryValues.map((value) => (
              <option key={value} value={value}>
                {opportunityCategoryLabels[value]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Montant potentiel (€)</Label>
          <Input id="amount" name="amount" type="number" min="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Probabilité (%)</Label>
          <Input id="probability" name="probability" type="number" min="0" max="100" defaultValue={50} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedCloseDate">Date estimée</Label>
          <Input id="estimatedCloseDate" name="estimatedCloseDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextAction">Prochaine action</Label>
        <Input id="nextAction" name="nextAction" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" rows={3} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Création…" : "Créer l'opportunité"}
      </Button>
    </form>
  );
}
