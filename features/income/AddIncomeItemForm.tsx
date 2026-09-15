"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { incomeCategoryLabels, incomeCategoryValues } from "./schemas";
import { createIncomeItem, type IncomeFormState } from "./actions";

const initialState: IncomeFormState = null;

export function AddIncomeItemForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState(createIncomeItem, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect name="category" className="w-56" defaultValue={incomeCategoryValues[0]}>
        {incomeCategoryValues.map((value) => (
          <option key={value} value={value}>
            {incomeCategoryLabels[value]}
          </option>
        ))}
      </NativeSelect>
      <Input name="label" placeholder="Description (optionnel)" className="w-40" />
      <Input name="amount" type="number" min="0" step="1" placeholder="Montant annuel (€)" className="w-36" required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter un revenu"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
