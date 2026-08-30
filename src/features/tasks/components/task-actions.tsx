import { ExternalLink, PencilIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/hooks/use-confirm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useDeleteTask } from "../api/use-delete-task";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

interface TaskActionsProps {
  id: string;
  projectId: string;
  children: React.ReactNode;
}

export const TaskActions = ({ id, projectId, children }: TaskActionsProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { open } = useEditTaskModal();

  const [ConfirmDialog, confirm] = useConfirm(
    "タスクを削除しますか？",
    "削除したタスクは元に戻せません。",
    "destructive"
  );
  const { mutate, isPending } = useDeleteTask();

  const onDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    mutate({ param: { taskId: id } });
  };

  return (
    <div className="flex justify-end">
      <ConfirmDialog />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => router.push(`/workspaces/${workspaceId}/tasks/${id}`)}
            className="p-2.5 text-sm font-medium"
          >
            <ExternalLink className="mr-2 size-4 stroke-2" />
            タスク詳細
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/workspaces/${workspaceId}/projects/${projectId}`)
            }
            className="p-2.5 text-sm font-medium"
          >
            <ExternalLink className="mr-2 size-4 stroke-2" />
            店舗を開く
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => open(id)}
            className="p-2.5 text-sm font-medium"
          >
            <PencilIcon className="mr-2 size-4 stroke-2" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            disabled={isPending}
            className="p-2.5 text-sm font-medium text-red-600 focus:text-red-600"
          >
            <TrashIcon className="mr-2 size-4 stroke-2" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
