"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { createProduct, type ProductFormState } from "./actions";
import { productCategoryLabels, productCategoryValues } from "./schemas";

const initialState: ProductFormState = null;

export function AddProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
      <Input name="name" placeholder="Nom du produit" className="w-48" required />
      <NativeSelect name="category" className="w-32" defaultValue={productCategoryValues[0]}>
        {productCategoryValues.map((value) => (
          <option key={value} value={value}>
            {productCategoryLabels[value]}
          </option>
        ))}
      </NativeSelect>
      <Input name="provider" placeholder="Assureur (optionnel)" className="w-36" />
      <Input name="description" placeholder="Description (optionnel)" className="w-48" />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
