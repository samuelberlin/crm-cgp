"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createSubscription, type SubscriptionFormState } from "./actions";

const initialState: SubscriptionFormState = null;

export function AddSubscriptionForm({
  contactId,
  products,
}: {
  contactId: string;
  products: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(createSubscription, initialState);

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun produit actif dans le catalogue. Ajoutez-en un depuis les Paramètres.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect name="productId" className="w-56" defaultValue={products[0]?.id}>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </NativeSelect>
      <Input name="encours" type="number" min="0" step="1" placeholder="Encours (€)" className="w-32" required />
      <Input name="subscribedAt" type="date" className="w-40" />
      <Input name="note" placeholder="Note (optionnel)" className="w-40" />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter la souscription"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
