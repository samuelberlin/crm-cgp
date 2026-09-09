"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductActive } from "./actions";

export function ToggleProductActiveButton({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await toggleProductActive(productId);
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
      {active ? "Désactiver" : "Réactiver"}
    </button>
  );
}
