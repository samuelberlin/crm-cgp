"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { deleteContact } from "./actions";

export function DeleteContactButton({ contactId, contactName }: { contactId: string; contactName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    const confirmed = window.confirm(
      `Supprimer définitivement ${contactName} ? Son historique, ses tâches, rendez-vous, documents et souscriptions seront aussi supprimés. Cette action est irréversible.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      await deleteContact(contactId);
      router.push("/contacts");
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={buttonVariants({ variant: "destructive", size: "sm" })}
    >
      {isPending ? "Suppression…" : "Supprimer le contact"}
    </button>
  );
}
