import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TaskStatus } from "../types";
import { TASK_STATUS_LABELS } from "../constants";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";

const statusStyleMap: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-t-amber-400",
  [TaskStatus.TODO]: "border-t-slate-400",
  [TaskStatus.IN_PROGRESS]: "border-t-blue-400",
  [TaskStatus.IN_REVIEW]: "border-t-violet-400",
  [TaskStatus.DONE]: "border-t-emerald-400",
};

interface KanbanColumnHeaderProps {
  board: TaskStatus;
  taskCount: number;
}

export const KanbanColumnHeader = ({
  board,
  taskCount,
}: KanbanColumnHeaderProps) => {
  const { open } = useCreateTaskModal();

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t-[3px] px-3 pb-2 pt-3",
        statusStyleMap[board]
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-slate-700">
          {TASK_STATUS_LABELS[board]}
        </h2>
        <span className="flex min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-500">
          {taskCount}
        </span>
      </div>
      <Button
        onClick={open}
        variant="ghost"
        size="icon"
        className="size-7 text-slate-400 hover:bg-white hover:text-cyan-600"
      >
        <PlusIcon className="size-4" />
        <span className="sr-only">タスクを追加</span>
      </Button>
    </div>
  );
};
