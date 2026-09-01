import { CalendarDaysIcon, Clock3Icon, MoreHorizontalIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { TaskActions } from "./task-actions";
import { TaskDate } from "./task-date";

import { Task, TaskType } from "../types";
import { TASK_TYPE_ICONS, TASK_TYPE_LABELS } from "../constants";
import { getStoreAccent, normalizeTime } from "../task-utils";

interface KanbanCardProps {
  task: Task;
}

export const KanbanCard = ({ task }: KanbanCardProps) => {
  const taskType = task.taskType ?? TaskType.OTHER;

  return (
    <div
      className="group mb-2 rounded-md border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-cyan-200 hover:shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: getStoreAccent(task.projectId) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>{TASK_TYPE_ICONS[taskType]}</span>
            <span>{TASK_TYPE_LABELS[taskType]}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <p
              className={`min-w-0 line-clamp-2 text-sm leading-5 text-slate-800 ${
                task.isImportant ? "font-bold" : "font-medium"
              }`}
            >
              {task.name}
            </p>
            {task.isImportant && (
              <span className="mt-0.5 shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-red-600 ring-1 ring-inset ring-red-200">
                重要
              </span>
            )}
          </div>
        </div>
        <TaskActions id={task.$id} projectId={task.projectId}>
          <button className="flex size-6 shrink-0 items-center justify-center rounded text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100">
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">タスクメニュー</span>
          </button>
        </TaskActions>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <div className="flex min-w-0 items-center gap-1.5">
          <CalendarDaysIcon className="size-3.5 shrink-0 text-slate-400" />
          <TaskDate value={task.dueDate} className="truncate text-xs" />
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <Clock3Icon className="size-3.5 shrink-0 text-slate-400" />
          <span className="truncate">
            {normalizeTime(task.startTime)}〜{normalizeTime(task.endTime, "10:00")}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <ProjectAvatar
            name={task.project?.name ?? "店舗"}
            image={task.project?.imageUrl}
            className="size-5"
            fallbackClassName="text-[8px]"
          />
          <span className="truncate">{task.project?.name ?? "店舗未設定"}</span>
        </div>
        <MemberAvatar
          name={task.assignee?.name ?? "担当者"}
          className="size-6"
          fallbackClassName="text-[9px]"
        />
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 rounded bg-slate-50 px-2 py-1.5 text-[11px] leading-4 text-slate-500">
          {task.description}
        </p>
      )}
    </div>
  );
};
