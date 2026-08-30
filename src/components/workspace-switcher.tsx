"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateWorkspaceModal } from "@/features/workspaces/hooks/use-create-workspace-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

export const WorkspaceSwitcher = () => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { data: workspaces } = useGetWorkspaces();
  const { open } = useCreateWorkspaceModal();
  const { canCreateWorkspace } = useWorkspacePermissions();

  const onSelect = (id: string) => {
    router.push(`/workspaces/${id}`);
  };

  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-bold tracking-wide text-slate-400">
          ワークスペース
        </p>
        {canCreateWorkspace && (
          <Button
            onClick={open}
            variant="ghost"
            size="icon"
            className="size-6 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600"
          >
            <PlusIcon className="size-3.5" />
            <span className="sr-only">ワークスペースを追加</span>
          </Button>
        )}
      </div>
      <Select onValueChange={onSelect} value={workspaceId}>
        <SelectTrigger className="h-10 w-full border-slate-200 bg-slate-50 px-2.5 text-sm font-medium shadow-none focus:ring-cyan-500">
          <SelectValue placeholder="ワークスペースを選択" />
        </SelectTrigger>
        <SelectContent>
          {workspaces?.documents.map((workspace) => (
            <SelectItem key={workspace.$id} value={workspace.$id}>
              <div className="flex items-center justify-start gap-2.5 font-medium">
                <WorkspaceAvatar
                  name={workspace.name}
                  image={workspace.imageUrl}
                />
                <span className="truncate">{workspace.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
