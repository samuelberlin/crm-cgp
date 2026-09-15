"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteNote, updateNote, type NoteFormState } from "./actions";

const initialState: NoteFormState = null;

export function EditableNote({
  noteId,
  content,
  authorName,
  createdAt,
}: {
  noteId: string;
  content: string;
  authorName: string;
  createdAt: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const action = updateNote.bind(null, noteId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state?.error) {
      setIsEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  function onDelete() {
    startDeleteTransition(async () => {
      await deleteNote(noteId);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <li>
        <form action={formAction} className="space-y-2">
          <Textarea name="content" rows={2} defaultValue={content} required />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li>
      <p className="whitespace-pre-wrap">{content}</p>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {authorName} · {createdAt}
        </span>
        <button type="button" onClick={() => setIsEditing(true)} className="hover:text-foreground">
          Modifier
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="hover:text-destructive disabled:opacity-50"
        >
          Supprimer
        </button>
      </p>
    </li>
  );
}
