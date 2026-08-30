"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUpdateTask } from "../api/use-update-task";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { Task, TaskStatus, TaskType } from "../types";
import {
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "../constants";
import { getStoreAccent, normalizeTime, timeToMinutes } from "../task-utils";

interface DataScheduleProps {
  data: Task[];
}

export const DataSchedule = ({ data }: DataScheduleProps) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { open } = useEditTaskModal();

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    data.forEach((task) => {
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      const current = groups.get(key) ?? [];
      current.push(task);
      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({
        date,
        tasks: tasks.sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        ),
      }));
  }, [data]);

  if (groupedTasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        表示するタスクがありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-800">Iqubeスケジュール</p>
        <p className="mt-1 text-xs text-slate-500">
          日付ごとの店舗運営タスクを縦に一覧表示します。行をタップすると詳細を編集できます。
        </p>
      </div>

      {groupedTasks.map(({ date, tasks }) => (
        <section key={date} className="overflow-hidden rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-slate-800">
              {format(new Date(`${date}T00:00:00`), "M月d日（E）", { locale: ja })}
            </h3>
            <span className="text-xs text-slate-500">{tasks.length}件</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-white text-left text-xs text-slate-500">
                  <th className="px-3 py-2 font-semibold">時間</th>
                  <th className="px-3 py-2 font-semibold">タスク</th>
                  <th className="px-3 py-2 font-semibold">店舗</th>
                  <th className="px-3 py-2 font-semibold">担当者</th>
                  <th className="px-3 py-2 font-semibold">メモ</th>
                  <th className="px-3 py-2 font-semibold">ステータス</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const taskType = task.taskType ?? TaskType.OTHER;
                  return (
                    <tr
                      key={task.$id}
                      className="cursor-pointer border-b last:border-b-0 hover:bg-cyan-50/40"
                      onClick={() => open(task.$id)}
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-600">
                        {normalizeTime(task.startTime)}〜{normalizeTime(task.endTime, "10:00")}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{TASK_TYPE_ICONS[taskType]}</span>
                          <div className="min-w-0">
                            <p
                              className={`truncate text-slate-800 ${
                                task.isImportant ? "font-bold" : "font-medium"
                              }`}
                            >
                              {task.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {TASK_TYPE_LABELS[taskType]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: getStoreAccent(task.projectId) }}
                          />
                          <span className="max-w-[160px] truncate">
                            {task.project?.name ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="max-w-[150px] truncate">
                          {task.assignee?.name ?? "-"}
                        </span>
                      </td>
                      <td className="max-w-[240px] px-3 py-3 text-xs text-slate-500">
                        <span className="line-clamp-2">{task.description || "-"}</span>
                      </td>
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        <Select
                          value={task.status}
                          disabled={isPending}
                          onValueChange={(value) =>
                            updateTask({
                              param: { taskId: task.$id },
                              json: { status: value as TaskStatus },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-[128px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(TaskStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {TASK_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={(event) => {
                            event.stopPropagation();
                            open(task.$id);
                          }}
                        >
                          <PencilIcon className="size-4" />
                          <span className="sr-only">編集</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};
