"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscription } from "./actions";

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await cancelSubscription(subscriptionId);
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
      Résilier
    </button>
  );
}
