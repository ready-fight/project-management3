"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { cn } from "@/lib/utils";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Button } from "@/components/ui/button";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

export const Projects = () => {
  const pathname = usePathname();
  const { open } = useCreateProjectModal();
  const workspaceId = useWorkspaceId();
  const { data } = useGetProjects({ workspaceId });
  const { canManageStores } = useWorkspacePermissions();

  return (
    <div className="flex flex-col gap-1 px-1 overflow-auto max-h-[300px]">
      <div className="mb-1 flex items-center justify-between px-2">
        <p className="text-[11px] font-bold tracking-wide text-slate-400">
          店舗
        </p>
        {canManageStores && (
          <Button
            onClick={open}
            variant="ghost"
            size="icon"
            className="size-6 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600"
          >
            <PlusIcon className="size-3.5" />
            <span className="sr-only">店舗を追加</span>
          </Button>
        )}
      </div>
      {data?.documents.map((project) => {
        const href = `/workspaces/${workspaceId}/projects/${project.$id}`;
        const isActive = pathname === href;

        return (
          <Link key={project.$id} href={href}>
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50",
                isActive && "bg-cyan-50 text-cyan-700 hover:bg-cyan-50"
              )}
            >
              <ProjectAvatar image={project.imageUrl} name={project.name} />
              <span className="truncate">{project.name}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
