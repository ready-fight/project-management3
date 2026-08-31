import { CalendarDaysIcon, ListChecksIcon, StoreIcon, XIcon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTaskFilters } from "../hooks/use-task-filters";
import { TaskStatus } from "../types";
import { TASK_STATUS_LABELS } from "../constants";
import { MemberFilterCombobox } from "./member-filter-combobox";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
}

export const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const isLoading = isLoadingProjects || isLoadingMembers;
  const projectOptions = projects?.documents.map((project) => ({
    value: project.$id,
    label: project.name,
  }));
  const memberOptions = members?.documents.map((member) => ({
    id: member.$id,
    name: member.name,
  })) ?? [];

  const [{ status, assigneeId, projectId, dueDate }, setFilters] =
    useTaskFilters();

  const onStatusChange = (value: string) => {
    setFilters({ status: value === "all" ? null : (value as TaskStatus) });
  };

  const onAssigneeChange = (value: string | null) => {
    setFilters({ assigneeId: value });
  };

  const onProjectChange = (value: string) => {
    setFilters({ projectId: value === "all" ? null : value });
  };

  const hasFilters = Boolean(status || assigneeId || projectId || dueDate);

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      {!hideProjectFilter && (
        <Select value={projectId ?? "all"} onValueChange={onProjectChange}>
          <SelectTrigger className="h-9 w-full bg-white text-sm shadow-none lg:w-auto">
            <div className="flex items-center pr-2">
              <StoreIcon className="mr-2 size-4 text-slate-400" />
              <SelectValue placeholder="すべての店舗" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての店舗</SelectItem>
            <SelectSeparator />
            {projectOptions?.map((project) => (
              <SelectItem key={project.value} value={project.value}>
                {project.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <MemberFilterCombobox
        value={assigneeId}
        onChange={onAssigneeChange}
        options={memberOptions}
      />

      <DatePicker
        placeholder="日付"
        className="h-9 w-full bg-white text-sm shadow-none lg:w-auto"
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) => {
          setFilters({ dueDate: date ? date.toISOString() : null });
        }}
      />

      <Select value={status ?? "all"} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-full bg-white text-sm shadow-none lg:w-auto">
          <div className="flex items-center pr-2">
            <ListChecksIcon className="mr-2 size-4 text-slate-400" />
            <SelectValue placeholder="すべてのステータス" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのステータス</SelectItem>
          <SelectSeparator />
          {Object.values(TaskStatus).map((taskStatus) => (
            <SelectItem key={taskStatus} value={taskStatus}>
              {TASK_STATUS_LABELS[taskStatus]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 justify-start text-slate-500"
          onClick={() =>
            setFilters({
              projectId: null,
              assigneeId: null,
              dueDate: null,
              status: null,
            })
          }
        >
          <XIcon className="mr-1.5 size-4" />
          フィルタ解除
        </Button>
      )}

      <div className="hidden items-center gap-1 text-xs text-slate-400 xl:flex">
        <CalendarDaysIcon className="size-3.5" />
        3ビュー共通フィルタ
      </div>
    </div>
  );
};
