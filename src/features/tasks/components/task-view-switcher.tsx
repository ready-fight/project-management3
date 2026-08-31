"use client";

import {
  CalendarRangeIcon,
  Clock3Icon,
  LayoutGridIcon,
  LoaderIcon,
  PlusIcon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { format } from "date-fns";
import { useCallback, useMemo } from "react";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DataFilters } from "./data-filters";
import { DataKanban } from "./data-kanban";
import { DataSchedule } from "./data-schedule";
import { DataTimeline } from "./data-timeline";

import { useGetTasks } from "../api/use-get-tasks";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";
import { useTaskFilters } from "../hooks/use-task-filters";
import { useTaskRealtime } from "../hooks/use-task-realtime";
import { TaskStatus } from "../types";
import { useBulkUpdateTasks } from "../api/use-bulk-update-tasks";

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}

export const TaskViewSwitcher = ({
  hideProjectFilter,
}: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, projectId, dueDate }] = useTaskFilters();
  const [view, setView] = useQueryState("task-view", { defaultValue: "kanban" });
  const { mutate: bulkUpdate } = useBulkUpdateTasks();

  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  // The timeline always needs all stores available as drag targets.
  // A route/filter store becomes the active highlighted store instead of
  // restricting the query while the timeline is open.
  const timelineUsesStoreFocus = view === "timeline";
  const queryProjectId = timelineUsesStoreFocus
    ? undefined
    : paramProjectId || projectId;
  const { status: syncStatus } = useTaskRealtime({ workspaceId });
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    isFetching: isFetchingTasks,
    refetch: refetchTasks,
  } = useGetTasks({
    workspaceId,
    projectId: queryProjectId,
    assigneeId,
    status,
    dueDate,
    fallbackRefresh: syncStatus === "fallback",
  });

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdate({ json: { tasks } });
    },
    [bulkUpdate]
  );

  const { open } = useCreateTaskModal();
  const taskData = useMemo(() => tasks?.documents ?? [], [tasks?.documents]);
  const effectiveProjectId = paramProjectId || projectId;

  // Keep the UI filters authoritative while React Query swaps/refetches results.
  // In the workspace timeline, 店舗 selection is intentionally treated as a
  // focus rather than a hard filter so other stores remain visible drag targets.
  const filteredTaskData = useMemo(
    () =>
      taskData.filter((task) => {
        if (
          !timelineUsesStoreFocus &&
          effectiveProjectId &&
          task.projectId !== effectiveProjectId
        ) {
          return false;
        }
        if (assigneeId && task.assigneeId !== assigneeId) return false;
        if (status && task.status !== status) return false;
        if (
          dueDate &&
          format(new Date(task.dueDate), "yyyy-MM-dd") !==
            format(new Date(dueDate), "yyyy-MM-dd")
        ) {
          return false;
        }
        return true;
      }),
    [
      assigneeId,
      dueDate,
      effectiveProjectId,
      status,
      taskData,
      timelineUsesStoreFocus,
    ]
  );

  return (
    <Tabs
      value={view}
      onValueChange={setView}
      className="flex-1 overflow-hidden rounded-lg border bg-white shadow-sm"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto w-full justify-start overflow-x-auto bg-slate-100 p-1 lg:w-auto">
            <TabsTrigger
              className="h-8 shrink-0 gap-1.5 px-3 text-xs lg:w-auto"
              value="kanban"
            >
              <LayoutGridIcon className="size-3.5" />
              カンバン
            </TabsTrigger>
            <TabsTrigger
              className="h-8 shrink-0 gap-1.5 px-3 text-xs lg:w-auto"
              value="timeline"
            >
              <Clock3Icon className="size-3.5" />
              時系列ビュー
            </TabsTrigger>
            <TabsTrigger
              className="h-8 shrink-0 gap-1.5 px-3 text-xs lg:w-auto"
              value="schedule"
            >
              <CalendarRangeIcon className="size-3.5" />
              Iqubeスケジュール
            </TabsTrigger>
          </TabsList>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <div
              className={`hidden h-9 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium sm:flex ${
                syncStatus === "realtime"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : syncStatus === "fallback"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
              title={
                syncStatus === "realtime"
                  ? "Appwrite Realtimeで他ユーザーの変更を同期します"
                  : syncStatus === "fallback"
                    ? "Realtimeが利用できないため30分ごとの安全同期を使用しています"
                    : "Realtime接続を確認しています"
              }
            >
              {syncStatus === "realtime" ? (
                <WifiIcon className="size-3.5" />
              ) : (
                <WifiOffIcon className="size-3.5" />
              )}
              {syncStatus === "realtime"
                ? "リアルタイム同期"
                : syncStatus === "fallback"
                  ? "30分同期"
                  : "同期確認中"}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => void refetchTasks()}
              disabled={isFetchingTasks}
              title="タスクを再読み込み"
            >
              <RefreshCwIcon
                className={`size-4 ${isFetchingTasks ? "animate-spin" : ""}`}
              />
              <span className="sr-only">再読み込み</span>
            </Button>
            <Button onClick={open} size="sm" className="h-9 flex-1 lg:flex-none">
              <PlusIcon className="mr-1.5 size-4" />
              タスクを追加
            </Button>
          </div>
        </div>

        <div className="border-b bg-slate-50/70 px-4 py-3">
          <DataFilters
            hideProjectFilter={hideProjectFilter}
            showTimelineHours={view === "timeline"}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {isLoadingTasks ? (
            <div className="flex h-[240px] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50">
              <LoaderIcon className="size-5 animate-spin text-cyan-600" />
              <p className="mt-2 text-xs text-slate-500">読み込み中...</p>
            </div>
          ) : (
            <>
              <TabsContent value="kanban" className="mt-0">
                <DataKanban data={filteredTaskData} onChange={onKanbanChange} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-0">
                <DataTimeline data={filteredTaskData} />
              </TabsContent>
              <TabsContent value="schedule" className="mt-0 pb-4">
                <DataSchedule data={filteredTaskData} />
              </TabsContent>
            </>
          )}
        </div>
      </div>
    </Tabs>
  );
};
