import { Clock3Icon, PencilIcon, StoreIcon } from "lucide-react";

import { DottedSeparator } from "@/components/dotted-separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { OverviewProperty } from "./overview-property";
import { TaskDate } from "./task-date";

import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { Task, TaskType } from "../types";
import {
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "../constants";
import { normalizeTime } from "../task-utils";

interface TaskOverviewProps {
  task: Task;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();
  const taskType = task.taskType ?? TaskType.OTHER;

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">タスク情報</p>
          <Button onClick={() => open(task.$id)} size="sm" variant="secondary">
            <PencilIcon className="mr-2 size-4" />
            編集
          </Button>
        </div>
        <DottedSeparator className="my-4" />
        <div className="flex flex-col gap-y-4">
          <OverviewProperty label="店舗">
            <StoreIcon className="size-4 text-muted-foreground" />
            <ProjectAvatar
              name={task.project?.name ?? "店舗"}
              image={task.project?.imageUrl}
              className="size-6"
            />
            <p className="text-sm font-medium">{task.project?.name ?? "-"}</p>
          </OverviewProperty>
          <OverviewProperty label="担当者">
            <MemberAvatar name={task.assignee?.name ?? "担当者"} className="size-6" />
            <p className="text-sm font-medium">{task.assignee?.name ?? "-"}</p>
          </OverviewProperty>
          <OverviewProperty label="日付">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </OverviewProperty>
          <OverviewProperty label="時間">
            <Clock3Icon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {normalizeTime(task.startTime)}〜{normalizeTime(task.endTime, "10:00")}
            </p>
          </OverviewProperty>
          <OverviewProperty label="種別">
            <span>{TASK_TYPE_ICONS[taskType]}</span>
            <p className="text-sm font-medium">{TASK_TYPE_LABELS[taskType]}</p>
          </OverviewProperty>
          <OverviewProperty label="ステータス">
            <Badge variant={task.status}>{TASK_STATUS_LABELS[task.status]}</Badge>
          </OverviewProperty>
          {task.isImportant && (
            <OverviewProperty label="重要度">
              <Badge variant="destructive">重要</Badge>
            </OverviewProperty>
          )}
        </div>
      </div>
    </div>
  );
};
