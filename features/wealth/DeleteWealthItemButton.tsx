"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWealthItem } from "./actions";

export function DeleteWealthItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await deleteWealthItem(itemId);
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
