"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AiResult } from "./actions";

export function AiActionButton({
  label,
  pendingLabel,
  action,
}: {
  label: string;
  pendingLabel: string;
  action: () => Promise<AiResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AiResult | null>(null);

  function onClick() {
    startTransition(async () => {
      setResult(await action());
    });
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      {result && "error" in result && <p className="mt-2 text-sm text-destructive">{result.error}</p>}
      {result && "text" in result && (
        <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{result.text}</p>
      )}
    </div>
  );
}
