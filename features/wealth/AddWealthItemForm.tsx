"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { wealthCategoryLabels } from "./schemas";
import type { WealthFormState } from "./actions";

const initialState: WealthFormState = null;

export function AddWealthItemForm({
  contactId,
  categories,
  action,
  submitLabel,
}: {
  contactId: string;
  categories: readonly string[];
  action: (prevState: WealthFormState, formData: FormData) => Promise<WealthFormState>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect name="category" className="w-36" defaultValue={categories[0]}>
        {categories.map((value) => (
          <option key={value} value={value}>
            {wealthCategoryLabels[value as keyof typeof wealthCategoryLabels]}
          </option>
        ))}
      </NativeSelect>
      <Input name="label" placeholder="Description (optionnel)" className="w-40" />
      <Input name="amount" type="number" min="0" step="1" placeholder="Montant (€)" className="w-32" required />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : submitLabel}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
