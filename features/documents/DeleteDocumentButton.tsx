"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument } from "./actions";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await deleteDocument(documentId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
