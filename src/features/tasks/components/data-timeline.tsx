"use client";

import { useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useUpdateTask } from "../api/use-update-task";
import { TASK_STATUS_LABELS, TASK_TYPE_ICONS, TASK_TYPE_LABELS } from "../constants";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { useTaskFilters } from "../hooks/use-task-filters";
import {
  getTaskDurationMinutes,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
} from "../task-utils";
import { Task, TaskStatus, TaskType } from "../types";

type GroupBy = "store" | "assignee";

type Group = {
  id: string;
  name: string;
  imageUrl?: string;
};

type TimelineDrag = {
  task: Task;
  pointerId: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  targetGroupIndex: number;
  targetStartMinutes: number;
  moved: boolean;
};

const START_MINUTES = 9 * 60;
const END_MINUTES = 18 * 60;
const SNAP_MINUTES = 30;
const HOUR_HEIGHT = 78;
const TIMELINE_HEIGHT = ((END_MINUTES - START_MINUTES) / 60) * HOUR_HEIGHT;
const GROUP_WIDTH = 250;

const HOURS = Array.from(
  { length: (END_MINUTES - START_MINUTES) / 60 + 1 },
  (_, index) => START_MINUTES + index * 60
);

const statusCardClasses: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "border-amber-300 bg-amber-50/95",
  [TaskStatus.TODO]: "border-slate-300 bg-slate-50/95",
  [TaskStatus.IN_PROGRESS]: "border-blue-300 bg-blue-50/95",
  [TaskStatus.IN_REVIEW]: "border-violet-300 bg-violet-50/95",
  [TaskStatus.DONE]: "border-emerald-300 bg-emerald-50/95",
};

const statusDotClasses: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "bg-amber-400",
  [TaskStatus.TODO]: "bg-slate-400",
  [TaskStatus.IN_PROGRESS]: "bg-blue-500",
  [TaskStatus.IN_REVIEW]: "bg-violet-500",
  [TaskStatus.DONE]: "bg-emerald-500",
};

const taskDateKey = (task: Task) => format(new Date(task.dueDate), "yyyy-MM-dd");

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface DataTimelineProps {
  data: Task[];
}

export const DataTimeline = ({ data }: DataTimelineProps) => {
  const workspaceId = useWorkspaceId();
  const routeProjectId = useProjectId();
  const [groupBy, setGroupBy] = useState<GroupBy>("store");
  const [dragPreview, setDragPreview] = useState<TimelineDrag | null>(null);
  const dragRef = useRef<TimelineDrag | null>(null);
  const columnsRef = useRef<HTMLDivElement | null>(null);

  const [{ projectId, assigneeId, status, dueDate }, setFilters] = useTaskFilters();
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { open } = useEditTaskModal();
  const { currentMember } = useWorkspacePermissions();
  const { data: projects } = useGetProjects({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const selectedDateKey = useMemo(() => {
    if (dueDate) return format(new Date(dueDate), "yyyy-MM-dd");

    const firstTaskDate = data
      .map(taskDateKey)
      .sort((a, b) => a.localeCompare(b))[0];

    return firstTaskDate ?? format(new Date(), "yyyy-MM-dd");
  }, [data, dueDate]);

  const visibleTasks = useMemo(
    () =>
      data.filter((task) => {
        if (taskDateKey(task) !== selectedDateKey) return false;

        // In 店舗 view, a selected/route store is only the active focus.
        // In 担当者 view, the active store remains a real task filter.
        const activeStoreId = routeProjectId || projectId;
        if (
          groupBy === "assignee" &&
          activeStoreId &&
          task.projectId !== activeStoreId
        ) {
          return false;
        }

        if (assigneeId && task.assigneeId !== assigneeId) return false;
        if (status && task.status !== status) return false;
        return true;
      }),
    [
      assigneeId,
      data,
      groupBy,
      projectId,
      routeProjectId,
      selectedDateKey,
      status,
    ]
  );

  const groups = useMemo<Group[]>(() => {
    if (groupBy === "store") {
      const allStores =
        projects?.documents.map((project) => ({
          id: project.$id,
          name: project.name,
          imageUrl: project.imageUrl,
        })) ?? [];

      // Keep every store available for cross-store drag/drop. The active
      // store can come from either the current store route or the shared filter.
      const activeStoreId = routeProjectId || projectId;

      return [...allStores].sort((a, b) => {
        if (a.id === activeStoreId) return -1;
        if (b.id === activeStoreId) return 1;
        return a.name.localeCompare(b.name, "ja");
      });
    }

    const allMembers =
      members?.documents.map((member) => ({
        id: member.$id,
        name: member.name,
      })) ?? [];

    return assigneeId
      ? allMembers.filter((member) => member.id === assigneeId)
      : allMembers;
  }, [
    assigneeId,
    groupBy,
    members?.documents,
    projectId,
    projects?.documents,
    routeProjectId,
  ]);

  const activeStoreId = routeProjectId || projectId;
  const focusedStore = useMemo(
    () => projects?.documents.find((project) => project.$id === activeStoreId),
    [activeStoreId, projects?.documents]
  );
  const isStoreFocus = groupBy === "store" && Boolean(activeStoreId);
  const timelineHeaderHeight = 72;
  const personalStartMinutes = clamp(
    timeToMinutes(currentMember?.timelineStartTime ?? "09:00"),
    START_MINUTES,
    END_MINUTES
  );
  const personalEndMinutes = clamp(
    timeToMinutes(currentMember?.timelineEndTime ?? "18:00"),
    START_MINUTES,
    END_MINUTES
  );
  const personalBeforeHeight =
    ((personalStartMinutes - START_MINUTES) / 60) * HOUR_HEIGHT;
  const personalAfterTop =
    ((personalEndMinutes - START_MINUTES) / 60) * HOUR_HEIGHT;

  const tasksByGroup = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    groups.forEach((group) => grouped.set(group.id, []));

    visibleTasks.forEach((task) => {
      const groupId = groupBy === "store" ? task.projectId : task.assigneeId;
      grouped.get(groupId)?.push(task);
    });

    grouped.forEach((tasks) =>
      tasks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    );

    return grouped;
  }, [groupBy, groups, visibleTasks]);

  const changeDate = (offset: number) => {
    const current = new Date(`${selectedDateKey}T00:00:00`);
    const next = addDays(current, offset);
    setFilters({ dueDate: next.toISOString() });
  };

  const startDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    task: Task,
    groupIndex: number
  ) => {
    if (isPending || groups.length === 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const drag: TimelineDrag = {
      task,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      deltaX: 0,
      deltaY: 0,
      targetGroupIndex: groupIndex,
      targetStartMinutes: timeToMinutes(task.startTime),
      moved: false,
    };

    dragRef.current = drag;
    setDragPreview(drag);
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const columns = columnsRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !columns) return;

    event.preventDefault();

    const rect = columns.getBoundingClientRect();
    const columnWidth = rect.width / groups.length;
    const targetGroupIndex = clamp(
      Math.floor((event.clientX - rect.left) / columnWidth),
      0,
      groups.length - 1
    );

    const duration = getTaskDurationMinutes(drag.task.startTime, drag.task.endTime);
    const rawMinutes = START_MINUTES + ((event.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const snappedMinutes =
      START_MINUTES +
      Math.round((rawMinutes - START_MINUTES) / SNAP_MINUTES) * SNAP_MINUTES;
    const targetStartMinutes = clamp(
      snappedMinutes,
      START_MINUTES,
      Math.max(START_MINUTES, END_MINUTES - duration)
    );

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const moved = drag.moved || Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;

    const nextDrag: TimelineDrag = {
      ...drag,
      deltaX,
      deltaY,
      targetGroupIndex,
      targetStartMinutes,
      moved,
    };

    dragRef.current = nextDrag;
    setDragPreview(nextDrag);
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setDragPreview(null);

    if (!drag.moved) {
      open(drag.task.$id);
      return;
    }

    const targetGroup = groups[drag.targetGroupIndex];
    if (!targetGroup) return;

    const duration = getTaskDurationMinutes(drag.task.startTime, drag.task.endTime);
    const startTime = minutesToTime(drag.targetStartMinutes);
    const endTime = minutesToTime(drag.targetStartMinutes + duration);

    updateTask({
      param: { taskId: drag.task.$id },
      json: {
        startTime,
        endTime,
        ...(groupBy === "store"
          ? { projectId: targetGroup.id }
          : { assigneeId: targetGroup.id }),
      },
    });
  };

  const cancelDrag = () => {
    dragRef.current = null;
    setDragPreview(null);
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        時系列ビューを表示するには店舗またはメンバーを登録してください。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Clock3Icon className="size-5 text-blue-600" />
            時系列ビュー
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            タスクをドラッグして時間と{groupBy === "store" ? "店舗" : "担当者"}を変更できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 items-center overflow-hidden rounded-lg border bg-white shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 rounded-none border-r"
              onClick={() => changeDate(-1)}
            >
              <ChevronLeftIcon className="size-4" />
              <span className="sr-only">前日</span>
            </Button>
            <div className="min-w-[152px] px-4 text-center text-sm font-semibold text-slate-800">
              {format(new Date(`${selectedDateKey}T00:00:00`), "yyyy/MM/dd (E)", {
                locale: ja,
              })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 rounded-none border-l"
              onClick={() => changeDate(1)}
            >
              <ChevronRightIcon className="size-4" />
              <span className="sr-only">翌日</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">表示軸:</span>
            <div className="flex rounded-lg border bg-white p-1 shadow-sm">
              <Button
                type="button"
                size="sm"
                variant={groupBy === "store" ? "primary" : "ghost"}
                className="h-8"
                onClick={() => setGroupBy("store")}
              >
                <StoreIcon className="size-4" />
                店舗
              </Button>
              <Button
                type="button"
                size="sm"
                variant={groupBy === "assignee" ? "primary" : "ghost"}
                className="h-8"
                onClick={() => setGroupBy("assignee")}
              >
                <UsersIcon className="size-4" />
                担当者
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isStoreFocus && (
        <div className="flex flex-col gap-2 rounded-lg border border-cyan-200 bg-cyan-50/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-cyan-800">
            <span className="font-bold">{focusedStore?.name ?? "選択中の店舗"}</span>
            をフォーカス中です。他の店舗もドラッグ先として表示しています。
          </p>
          {!routeProjectId && projectId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 self-start text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 sm:self-auto"
              onClick={() => setFilters({ projectId: null })}
            >
              フォーカス解除
            </Button>
          )}
        </div>
      )}

      {groupBy === "assignee" && activeStoreId && (
        <p className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-500">
          担当者表示では、アクティブな店舗のタスクだけを表示しています。
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-xs text-slate-600">
        {Object.values(TaskStatus).map((taskStatus) => (
          <span key={taskStatus} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${statusDotClasses[taskStatus]}`} />
            {TASK_STATUS_LABELS[taskStatus]}
          </span>
        ))}
      </div>

      <div className="overflow-auto rounded-xl border bg-white shadow-sm">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `76px ${groups.length * GROUP_WIDTH}px` }}
        >
          <div
            className="sticky left-0 top-0 z-40 flex items-center justify-center border-b border-r bg-white text-sm font-bold text-slate-700"
            style={{ height: timelineHeaderHeight }}
          >
            時間
          </div>

          <div
            className="sticky top-0 z-30 grid border-b bg-white"
            style={{
              height: timelineHeaderHeight,
              gridTemplateColumns: `repeat(${groups.length}, ${GROUP_WIDTH}px)`,
            }}
          >
            {groups.map((group) => {
              const isFocusedGroup = isStoreFocus && group.id === activeStoreId;

              return (
                <div
                  key={group.id}
                  className={`flex items-center justify-center gap-2 border-r px-4 text-sm font-bold ${
                    isFocusedGroup
                      ? "bg-cyan-50 text-cyan-800 ring-1 ring-inset ring-cyan-200"
                      : "text-slate-800"
                  }`}
                >
                  {groupBy === "assignee" ? (
                    <MemberAvatar name={group.name} className="size-8" />
                  ) : (
                    <ProjectAvatar
                      name={group.name}
                      image={group.imageUrl}
                      className="size-8 rounded-full"
                      fallbackClassName="rounded-full"
                    />
                  )}
                  <span className="truncate">{group.name}</span>
                </div>
              );
            })}
          </div>

          <div
            className="sticky left-0 z-20 border-r bg-white"
            style={{ height: TIMELINE_HEIGHT }}
          >
            {personalBeforeHeight > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-slate-200/50"
                style={{ height: personalBeforeHeight }}
              />
            )}
            {personalAfterTop < TIMELINE_HEIGHT && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-slate-200/50"
                style={{ height: TIMELINE_HEIGHT - personalAfterTop }}
              />
            )}
            {HOURS.map((minutes, index) => (
              <div
                key={minutes}
                className="absolute left-0 right-0 z-10 border-t px-3 pt-2 text-xs font-semibold text-slate-700"
                style={{ top: Math.min(index * HOUR_HEIGHT, TIMELINE_HEIGHT - 1) }}
              >
                {minutesToTime(minutes)}
              </div>
            ))}
          </div>

          <div
            ref={columnsRef}
            className="relative grid"
            style={{
              height: TIMELINE_HEIGHT,
              gridTemplateColumns: `repeat(${groups.length}, ${GROUP_WIDTH}px)`,
            }}
          >
            {groups.map((group, groupIndex) => {
              const isFocusedGroup = isStoreFocus && group.id === activeStoreId;

              return (
              <div
                key={group.id}
                className={`relative border-r ${
                  isFocusedGroup ? "bg-cyan-50/20 ring-1 ring-inset ring-cyan-100" : ""
                }`}
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0, transparent 77px, rgb(226 232 240) 77px, rgb(226 232 240) 78px)",
                }}
              >
                {personalBeforeHeight > 0 && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-[1] bg-slate-200/45"
                    style={{ height: personalBeforeHeight }}
                  />
                )}
                {personalAfterTop < TIMELINE_HEIGHT && (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-slate-200/45"
                    style={{ height: TIMELINE_HEIGHT - personalAfterTop }}
                  />
                )}

                {(tasksByGroup.get(group.id) ?? []).map((task) => {
                  const start = clamp(timeToMinutes(task.startTime), START_MINUTES, END_MINUTES);
                  const duration = getTaskDurationMinutes(task.startTime, task.endTime);
                  const top = ((start - START_MINUTES) / 60) * HOUR_HEIGHT;
                  const height = Math.max(50, (duration / 60) * HOUR_HEIGHT - 6);
                  const type = task.taskType ?? TaskType.OTHER;
                  const isDragging = dragPreview?.task.$id === task.$id;

                  return (
                    <button
                      key={task.$id}
                      type="button"
                      onPointerDown={(event) => startDrag(event, task, groupIndex)}
                      onPointerMove={moveDrag}
                      onPointerUp={finishDrag}
                      onPointerCancel={cancelDrag}
                      className={`absolute left-2 right-2 touch-none select-none overflow-hidden rounded-lg border p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
                        statusCardClasses[task.status]
                      } ${isDragging ? "z-50 cursor-grabbing shadow-xl ring-2 ring-blue-300" : "z-10 cursor-grab"}`}
                      style={{
                        top,
                        height,
                        transform: isDragging
                          ? `translate(${dragPreview.deltaX}px, ${dragPreview.deltaY}px)`
                          : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-blue-700">
                        <span>
                          {normalizeTime(task.startTime)} - {normalizeTime(task.endTime, "10:00")}
                        </span>
                        {task.isImportant && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-600">
                            重要
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 line-clamp-2 text-sm text-slate-900 ${task.isImportant ? "font-bold" : "font-semibold"}`}>
                        {task.name}
                      </p>
                      <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-600">
                        {TASK_TYPE_ICONS[type]} {TASK_TYPE_LABELS[type]}
                        {task.description ? ` ・ ${task.description}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
              );
            })}

            {dragPreview && (
              <div
                className="pointer-events-none absolute z-40 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow"
                style={{
                  left: dragPreview.targetGroupIndex * GROUP_WIDTH + 8,
                  top:
                    ((dragPreview.targetStartMinutes - START_MINUTES) / 60) *
                    HOUR_HEIGHT,
                }}
              >
                {groups[dragPreview.targetGroupIndex]?.name} ・ {minutesToTime(dragPreview.targetStartMinutes)}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        ※ ドラッグは30分単位でスナップします。担当者表示では、各メンバーの勤務時間外を薄いグレーで表示します。
      </p>
    </div>
  );
};
