"use client";

import { useMemo, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { UsersIcon, StoreIcon, Clock3Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { useUpdateTask } from "../api/use-update-task";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { Task, TaskType } from "../types";
import { TASK_TYPE_ICONS, TASK_TYPE_LABELS } from "../constants";
import {
  getStoreAccent,
  getTaskDurationMinutes,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
} from "../task-utils";

type GroupBy = "store" | "assignee";

type Group = {
  id: string;
  name: string;
};

const START_MINUTES = 9 * 60;
const END_MINUTES = 18 * 60;
const SLOT_MINUTES = 30;

const TIME_SLOTS = Array.from(
  { length: Math.floor((END_MINUTES - START_MINUTES) / SLOT_MINUTES) + 1 },
  (_, index) => minutesToTime(START_MINUTES + index * SLOT_MINUTES)
);

const nearestSlot = (value?: string) => {
  const minutes = timeToMinutes(normalizeTime(value, "09:00"));
  const clamped = Math.min(END_MINUTES, Math.max(START_MINUTES, minutes));
  const rounded = Math.round((clamped - START_MINUTES) / SLOT_MINUTES) * SLOT_MINUTES;
  return minutesToTime(START_MINUTES + rounded);
};

interface DataTimelineProps {
  data: Task[];
}

export const DataTimeline = ({ data }: DataTimelineProps) => {
  const workspaceId = useWorkspaceId();
  const [groupBy, setGroupBy] = useState<GroupBy>("store");
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { open } = useEditTaskModal();

  const { data: projects } = useGetProjects({ workspaceId });
  const { data: members } = useGetMembers({ workspaceId });

  const groups = useMemo<Group[]>(() => {
    if (groupBy === "store") {
      return (
        projects?.documents.map((project) => ({
          id: project.$id,
          name: project.name,
        })) ?? []
      );
    }

    return (
      members?.documents.map((member) => ({
        id: member.$id,
        name: member.name,
      })) ?? []
    );
  }, [groupBy, members?.documents, projects?.documents]);

  const taskMap = useMemo(() => {
    const map = new Map<string, Task[]>();

    data.forEach((task) => {
      const groupId = groupBy === "store" ? task.projectId : task.assigneeId;
      const slot = nearestSlot(task.startTime);
      const key = `${groupId}__${slot}`;
      const current = map.get(key) ?? [];
      current.push(task);
      map.set(key, current);
    });

    return map;
  }, [data, groupBy]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const task = data.find((item) => item.$id === result.draggableId);
    if (!task) return;

    const [groupId, startTime] = result.destination.droppableId.split("__");
    if (!groupId || !startTime) return;

    const duration = getTaskDurationMinutes(task.startTime, task.endTime);
    const newEndTime = minutesToTime(timeToMinutes(startTime) + duration);

    updateTask({
      param: { taskId: task.$id },
      json: {
        startTime,
        endTime: newEndTime,
        ...(groupBy === "store"
          ? { projectId: groupId }
          : { assigneeId: groupId }),
      },
    });
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        時系列ビューを表示するには店舗またはメンバーを登録してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Clock3Icon className="size-4 text-cyan-600" />
            09:00〜18:00 時系列ビュー
          </div>
          <p className="mt-1 text-xs text-slate-500">
            タスクを上下に移動すると時間、左右に移動すると
            {groupBy === "store" ? "店舗" : "担当者"}が変更されます。
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={groupBy === "store" ? "primary" : "outline"}
            onClick={() => setGroupBy("store")}
          >
            <StoreIcon className="mr-1.5 size-4" />
            店舗別
          </Button>
          <Button
            type="button"
            size="sm"
            variant={groupBy === "assignee" ? "primary" : "outline"}
            onClick={() => setGroupBy("assignee")}
          >
            <UsersIcon className="mr-1.5 size-4" />
            担当者別
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-auto rounded-lg border bg-white">
          <div
            className="grid min-w-max"
            style={{
              gridTemplateColumns: `72px repeat(${groups.length}, minmax(210px, 1fr))`,
            }}
          >
            <div className="sticky left-0 top-0 z-30 border-b border-r bg-slate-100 p-2 text-xs font-semibold text-slate-500">
              時刻
            </div>
            {groups.map((group) => (
              <div
                key={group.id}
                className="sticky top-0 z-20 border-b border-r bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: getStoreAccent(group.id) }}
                  />
                  <span className="truncate">{group.name}</span>
                </div>
              </div>
            ))}

            {TIME_SLOTS.flatMap((time) => [
              <div
                key={`time-${time}`}
                className="sticky left-0 z-10 min-h-[76px] border-b border-r bg-white px-2 py-2 text-xs font-medium text-slate-500"
              >
                {time}
              </div>,
              ...groups.map((group) => {
                const key = `${group.id}__${time}`;
                const tasks = taskMap.get(key) ?? [];

                return (
                  <Droppable droppableId={key} key={key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[76px] border-b border-r p-1.5 transition-colors ${
                          snapshot.isDraggingOver ? "bg-cyan-50" : "bg-white"
                        }`}
                      >
                        {tasks.map((task, index) => {
                          const type = task.taskType ?? TaskType.OTHER;
                          return (
                            <Draggable
                              key={task.$id}
                              draggableId={task.$id}
                              index={index}
                              isDragDisabled={isPending}
                            >
                              {(dragProvided, dragSnapshot) => (
                                <button
                                  type="button"
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  onClick={() => open(task.$id)}
                                  className={`mb-1.5 w-full rounded-md border bg-white p-2 text-left shadow-sm transition hover:border-cyan-300 hover:shadow ${
                                    dragSnapshot.isDragging ? "rotate-1 shadow-lg" : ""
                                  }`}
                                  style={{
                                    ...dragProvided.draggableProps.style,
                                    borderLeftWidth: 4,
                                    borderLeftColor: getStoreAccent(task.projectId),
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span
                                      className={`line-clamp-2 text-xs text-slate-800 ${
                                        task.isImportant ? "font-bold" : "font-medium"
                                      }`}
                                    >
                                      {TASK_TYPE_ICONS[type]} {task.name}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-slate-400">
                                      {normalizeTime(task.startTime)}
                                    </span>
                                  </div>
                                  <div className="mt-1 line-clamp-1 text-[10px] text-slate-500">
                                    {TASK_TYPE_LABELS[type]}
                                    {task.description ? ` ・ ${task.description}` : ""}
                                  </div>
                                </button>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              }),
            ])}
          </div>
        </div>
      </DragDropContext>

      <p className="text-xs text-muted-foreground">
        ※ MVPでは30分単位のドラッグ配置です。フォームからは5分単位で時刻を直接編集できます。
      </p>
    </div>
  );
};
