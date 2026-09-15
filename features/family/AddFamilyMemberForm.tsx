"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createFamilyMember, type FamilyMemberFormState } from "./actions";
import { familyRelationshipLabels, familyRelationshipValues } from "./schemas";

const initialState: FamilyMemberFormState = null;

export function AddFamilyMemberForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState(createFamilyMember, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect name="relationship" className="w-32" defaultValue={familyRelationshipValues[0]}>
        {familyRelationshipValues.map((value) => (
          <option key={value} value={value}>
            {familyRelationshipLabels[value]}
          </option>
        ))}
      </NativeSelect>
      <Input name="firstName" placeholder="Prénom" className="w-32" required />
      <Input name="lastName" placeholder="Nom" className="w-32" required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
