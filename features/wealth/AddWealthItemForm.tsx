"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { familyRelationshipLabels } from "@/features/family/schemas";
import { beneficiaryCategoryValues, wealthCategoryLabels } from "./schemas";
import type { WealthFormState } from "./actions";

const initialState: WealthFormState = null;

export function AddWealthItemForm({
  contactId,
  categories,
  action,
  submitLabel,
  familyMembers,
}: {
  contactId: string;
  categories: readonly string[];
  action: (prevState: WealthFormState, formData: FormData) => Promise<WealthFormState>;
  submitLabel: string;
  familyMembers?: { id: string; firstName: string; lastName: string; relationship: string }[];
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [category, setCategory] = useState(categories[0]);
  const showBeneficiaryFields = (beneficiaryCategoryValues as readonly string[]).includes(category);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect
        name="category"
        className="w-36"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
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

      {showBeneficiaryFields && (
        <div className="w-full space-y-2 border-t pt-2">
          <div className="space-y-1">
            <label htmlFor={`subscribedAt-${contactId}`} className="text-xs text-muted-foreground">
              Date de souscription
            </label>
            <Input id={`subscribedAt-${contactId}`} name="subscribedAt" type="date" className="w-40" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Bénéficiaires</p>
            {!familyMembers || familyMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Ajoutez d&apos;abord un conjoint ou des enfants dans la section Famille ci-dessous pour pouvoir les
                désigner bénéficiaires.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {familyMembers.map((member) => (
                  <label key={member.id} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="beneficiaryIds" value={member.id} />
                    {member.firstName} {member.lastName}
                    <span className="text-xs text-muted-foreground">
                      ({familyRelationshipLabels[member.relationship as keyof typeof familyRelationshipLabels]})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
