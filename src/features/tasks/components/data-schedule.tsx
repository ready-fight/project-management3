"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { GripVerticalIcon, PencilIcon, TablePropertiesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { useUpdateTask } from "../api/use-update-task";
import {
  TASK_STATUS_LABELS,
  TASK_TYPE_ICONS,
  TASK_TYPE_LABELS,
} from "../constants";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { getStoreAccent, normalizeTime, timeToMinutes } from "../task-utils";
import { Task, TaskStatus, TaskType } from "../types";

type ScheduleDrag = {
  task: Task;
  pointerId: number;
  originDate: string;
  targetDate: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
};

const statusBadgeClasses: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-amber-200 bg-amber-50 text-amber-700",
  [TaskStatus.TODO]: "border-slate-200 bg-slate-50 text-slate-700",
  [TaskStatus.IN_PROGRESS]: "border-blue-200 bg-blue-50 text-blue-700",
  [TaskStatus.IN_REVIEW]: "border-violet-200 bg-violet-50 text-violet-700",
  [TaskStatus.DONE]: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusDotClasses: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "bg-amber-400",
  [TaskStatus.TODO]: "bg-slate-400",
  [TaskStatus.IN_PROGRESS]: "bg-blue-500",
  [TaskStatus.IN_REVIEW]: "bg-violet-500",
  [TaskStatus.DONE]: "bg-emerald-500",
};

interface DataScheduleProps {
  data: Task[];
}

export const DataSchedule = ({ data }: DataScheduleProps) => {
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { open } = useEditTaskModal();
  const dragRef = useRef<ScheduleDrag | null>(null);
  const [dragPreview, setDragPreview] = useState<ScheduleDrag | null>(null);

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
        tasks: [...tasks].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        ),
      }));
  }, [data]);

  const startDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    task: Task,
    originDate: string
  ) => {
    if (isPending) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const drag: ScheduleDrag = {
      task,
      pointerId: event.pointerId,
      originDate,
      targetDate: originDate,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };

    dragRef.current = drag;
    setDragPreview(drag);
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const row = target?.closest<HTMLElement>("[data-schedule-date]");
    const targetDate = row?.dataset.scheduleDate ?? drag.targetDate;
    const moved =
      drag.moved ||
      Math.abs(event.clientX - drag.startX) > 4 ||
      Math.abs(event.clientY - drag.startY) > 4 ||
      targetDate !== drag.originDate;

    const nextDrag: ScheduleDrag = {
      ...drag,
      targetDate,
      x: event.clientX,
      y: event.clientY,
      moved,
    };

    dragRef.current = nextDrag;
    setDragPreview(nextDrag);
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setDragPreview(null);

    if (!drag.moved || drag.targetDate === drag.originDate) return;

    updateTask({
      param: { taskId: drag.task.$id },
      json: { dueDate: new Date(`${drag.targetDate}T00:00:00`) },
    });
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDragPreview(null);
  };

  if (groupedTasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        表示するタスクがありません。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <TablePropertiesIcon className="size-5 text-blue-600" />
            Iqubeスケジュール（表形式）
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            店舗ごとの日付別タスク一覧。左のハンドルを別の日付へドラッグすると日付を変更できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          {Object.values(TaskStatus).map((taskStatus) => (
            <span key={taskStatus} className="inline-flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${statusDotClasses[taskStatus]}`} />
              {TASK_STATUS_LABELS[taskStatus]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-50">
              <tr className="border-b text-center text-xs font-semibold text-slate-700">
                <th className="w-[150px] border-r px-4 py-3">日付</th>
                <th className="w-[150px] border-r px-4 py-3">店舗</th>
                <th className="min-w-[260px] border-r px-4 py-3">タスク名</th>
                <th className="w-[150px] border-r px-4 py-3">カテゴリ</th>
                <th className="w-[180px] border-r px-4 py-3">担当者</th>
                <th className="w-[150px] border-r px-4 py-3">ステータス</th>
                <th className="w-[100px] border-r px-4 py-3">優先度</th>
                <th className="w-[150px] px-4 py-3">期限</th>
              </tr>
            </thead>

            <tbody>
              {groupedTasks.flatMap(({ date, tasks }) =>
                tasks.map((task, taskIndex) => {
                  const taskType = task.taskType ?? TaskType.OTHER;
                  const isTargetDate = dragPreview?.targetDate === date;
                  const isDragging = dragPreview?.task.$id === task.$id;

                  return (
                    <tr
                      key={task.$id}
                      data-schedule-date={date}
                      className={`cursor-pointer border-b transition-colors last:border-b-0 hover:bg-blue-50/40 ${
                        isTargetDate && dragPreview ? "bg-blue-50/70" : "bg-white"
                      } ${isDragging ? "opacity-45" : ""}`}
                      onClick={() => open(task.$id)}
                    >
                      {taskIndex === 0 && (
                        <td
                          rowSpan={tasks.length}
                          className={`border-r align-top ${
                            isTargetDate && dragPreview ? "bg-blue-50" : "bg-slate-50/60"
                          }`}
                        >
                          <div className="px-4 py-4">
                            <p className="font-bold text-slate-900">
                              {format(new Date(`${date}T00:00:00`), "yyyy/MM/dd (E)", {
                                locale: ja,
                              })}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {tasks.length}件
                            </p>
                            {isTargetDate && dragPreview && (
                              <p className="mt-2 text-[11px] font-semibold text-blue-600">
                                ここへ移動
                              </p>
                            )}
                          </div>
                        </td>
                      )}

                      <td className="border-r px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: getStoreAccent(task.projectId) }}
                          />
                          <span className="truncate font-medium text-slate-800">
                            {task.project?.name ?? "-"}
                          </span>
                        </div>
                      </td>

                      <td className="border-r px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 touch-none cursor-grab text-slate-400 hover:text-blue-600 active:cursor-grabbing"
                            disabled={isPending}
                            onPointerDown={(event) => startDrag(event, task, date)}
                            onPointerMove={moveDrag}
                            onPointerUp={finishDrag}
                            onPointerCancel={cancelDrag}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <GripVerticalIcon className="size-4" />
                            <span className="sr-only">日付をドラッグして変更</span>
                          </Button>
                          <div className="min-w-0">
                            <p
                              className={`truncate text-slate-900 ${
                                task.isImportant ? "font-bold" : "font-semibold"
                              }`}
                            >
                              {task.name}
                            </p>
                            {task.description && (
                              <p className="mt-0.5 max-w-[280px] truncate text-[11px] text-slate-400">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="border-r px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span>{TASK_TYPE_ICONS[taskType]}</span>
                          {TASK_TYPE_LABELS[taskType]}
                        </span>
                      </td>

                      <td className="border-r px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MemberAvatar name={task.assignee?.name ?? "-"} className="size-7" />
                          <span className="truncate font-medium text-slate-800">
                            {task.assignee?.name ?? "-"}
                          </span>
                        </div>
                      </td>

                      <td
                        className="border-r px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                          <SelectTrigger
                            className={`h-8 w-[122px] justify-center border text-xs font-semibold shadow-none ${
                              statusBadgeClasses[task.status]
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`size-2 rounded-full ${statusDotClasses[task.status]}`} />
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(TaskStatus).map((taskStatus) => (
                              <SelectItem key={taskStatus} value={taskStatus}>
                                {TASK_STATUS_LABELS[taskStatus]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="border-r px-4 py-3 text-center whitespace-nowrap">
                        {task.isImportant ? (
                          <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
                            高
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                            通常
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                          <span className="text-xs font-medium text-slate-700">
                            {format(new Date(task.dueDate), "MM/dd")} {normalizeTime(task.startTime)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-slate-400 hover:text-blue-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              open(task.$id);
                            }}
                          >
                            <PencilIcon className="size-3.5" />
                            <span className="sr-only">編集</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dragPreview && (
        <div
          className="pointer-events-none fixed z-[100] max-w-[260px] rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-xl"
          style={{ left: dragPreview.x + 14, top: dragPreview.y + 14 }}
        >
          <p className="truncate text-xs font-bold text-slate-900">
            {dragPreview.task.name}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-blue-600">
            → {format(new Date(`${dragPreview.targetDate}T00:00:00`), "M月d日 (E)", { locale: ja })}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        ※ ステータスは表から直接変更できます。その他の項目は行をタップして編集できます。
      </p>
    </div>
  );
};
