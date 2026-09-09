"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { postponeTask, updateTaskStatus } from "@/features/tasks/actions";

export function TaskActionButtons({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function complete() {
    startTransition(async () => {
      await updateTaskStatus(taskId, "TERMINEE");
      router.refresh();
    });
  }

  function postpone() {
    startTransition(async () => {
      await postponeTask(taskId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={complete} disabled={isPending}>
        Terminer
      </Button>
      <Button size="sm" variant="outline" onClick={postpone} disabled={isPending}>
        Reporter
      </Button>
    </div>
  );
}
