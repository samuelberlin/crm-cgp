"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote, type NoteFormState } from "./actions";

const initialState: NoteFormState = null;

export function NoteQuickForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState(createNote, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="contactId" value={contactId} />
      <Textarea name="content" rows={2} placeholder="Ajouter une note…" required />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Ajout…" : "Ajouter la note"}
      </Button>
    </form>
  );
}
