"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { uploadDocument, type DocumentFormState } from "./actions";
import { documentCategoryLabels, documentCategoryValues } from "./schemas";

const initialState: DocumentFormState = null;

export function UploadDocumentForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState(uploadDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <NativeSelect name="category" className="w-36" defaultValue="AUTRE">
        {documentCategoryValues.map((value) => (
          <option key={value} value={value}>
            {documentCategoryLabels[value]}
          </option>
        ))}
      </NativeSelect>
      <input
        type="file"
        name="file"
        required
        className="max-w-52 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Envoi…" : "Ajouter"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
