"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? "…" : "Se déconnecter"}
    </Button>
  );
}
