"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFiscalReminder } from "./actions";

export function DeleteFiscalReminderButton({ reminderId }: { reminderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await deleteFiscalReminder(reminderId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
