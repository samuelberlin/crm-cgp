"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFamilyMember } from "./actions";

export function DeleteFamilyMemberButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await deleteFamilyMember(memberId);
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
