import {
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import type { Project } from "@/features/projects/types";
import { client } from "@/lib/rpc";

import type { Task, TaskAssignee, TaskDocument } from "../types";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["$patch"]
>;

type TaskListCache = {
  documents: Task[];
  total: number;
};

type ProjectListCache = {
  documents: Project[];
};

type MemberListCache = {
  documents: TaskAssignee[];
};

type OptimisticTaskPatch = Partial<
  Pick<
    TaskDocument,
    | "name"
    | "status"
    | "projectId"
    | "assigneeId"
    | "dueDate"
    | "startTime"
    | "endTime"
    | "taskType"
    | "isImportant"
    | "description"
  >
>;

type MutationContext = {
  previousTaskLists: [QueryKey, TaskListCache | undefined][];
  previousTaskDetail: Task | undefined;
};

const toIsoDate = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  return undefined;
};

const toDateKey = (value: string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createOptimisticPatch = (json: RequestType["json"]): OptimisticTaskPatch => {
  const patch: OptimisticTaskPatch = {};

  if (json.name !== undefined) patch.name = json.name;
  if (json.status !== undefined) patch.status = json.status;
  if (json.projectId !== undefined) patch.projectId = json.projectId;
  if (json.assigneeId !== undefined) patch.assigneeId = json.assigneeId;
  if (json.startTime !== undefined) patch.startTime = json.startTime;
  if (json.endTime !== undefined) patch.endTime = json.endTime;
  if (json.taskType !== undefined) patch.taskType = json.taskType;
  if (json.isImportant !== undefined) patch.isImportant = json.isImportant;
  if (json.description !== undefined) patch.description = json.description;

  if (json.dueDate !== undefined) {
    const dueDate = toIsoDate(json.dueDate);
    if (dueDate) patch.dueDate = dueDate;
  }

  return patch;
};

const taskMatchesQuery = (task: Task, queryKey: QueryKey) => {
  if (!Array.isArray(queryKey) || queryKey[0] !== "tasks") return true;

  const [, workspaceId, projectId, status, assigneeId, dueDate, search] =
    queryKey as [
      string,
      string | undefined,
      string | null | undefined,
      string | null | undefined,
      string | null | undefined,
      string | null | undefined,
      string | null | undefined,
    ];

  if (workspaceId && task.workspaceId !== workspaceId) return false;
  if (projectId && task.projectId !== projectId) return false;
  if (status && task.status !== status) return false;
  if (assigneeId && task.assigneeId !== assigneeId) return false;
  if (dueDate && toDateKey(task.dueDate) !== toDateKey(dueDate)) return false;
  if (search && !task.name.toLowerCase().includes(search.toLowerCase())) return false;

  return true;
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ResponseType,
    Error,
    RequestType,
    MutationContext
  >({
    mutationFn: async ({ param, json }) => {
      const response = await client.api.tasks[":taskId"].$patch({
        param,
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update task.");
      }

      return await response.json();
    },
    onMutate: async ({ param, json }) => {
      const taskId = param.taskId;
      const patch = createOptimisticPatch(json);

      // Prevent an in-flight refetch from overwriting the optimistic state.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["tasks"] }),
        queryClient.cancelQueries({ queryKey: ["task", taskId] }),
      ]);

      const previousTaskLists = queryClient.getQueriesData<TaskListCache>({
        queryKey: ["tasks"],
      });
      const previousTaskDetail = queryClient.getQueryData<Task>([
        "task",
        taskId,
      ]);

      const enrichRelations = (task: Task): Task => {
        let nextTask: Task = { ...task, ...patch };

        if (patch.projectId && patch.projectId !== task.projectId) {
          const projects = queryClient.getQueryData<ProjectListCache>([
            "projects",
            task.workspaceId,
          ]);
          const project = projects?.documents.find(
            (item) => item.$id === patch.projectId
          );

          if (project) nextTask = { ...nextTask, project };
        }

        if (patch.assigneeId && patch.assigneeId !== task.assigneeId) {
          const members = queryClient.getQueryData<MemberListCache>([
            "members",
            task.workspaceId,
          ]);
          const assignee = members?.documents.find(
            (item) => item.$id === patch.assigneeId
          );

          if (assignee) nextTask = { ...nextTask, assignee };
        }

        return nextTask;
      };

      // Update every cached task-list query that currently contains this task.
      // This makes Kanban, timeline and Iqube reflect the edit immediately.
      previousTaskLists.forEach(([queryKey, previous]) => {
        if (!previous) return;

        const taskIndex = previous.documents.findIndex(
          (task) => task.$id === taskId
        );
        if (taskIndex === -1) return;

        const optimisticTask = enrichRelations(previous.documents[taskIndex]);
        const documents = [...previous.documents];

        if (taskMatchesQuery(optimisticTask, queryKey)) {
          documents[taskIndex] = optimisticTask;
        } else {
          documents.splice(taskIndex, 1);
        }

        queryClient.setQueryData<TaskListCache>(queryKey, {
          ...previous,
          documents,
          total:
            documents.length === previous.documents.length
              ? previous.total
              : Math.max(0, previous.total - 1),
        });
      });

      if (previousTaskDetail) {
        queryClient.setQueryData<Task>(
          ["task", taskId],
          enrichRelations(previousTaskDetail)
        );
      }

      return {
        previousTaskLists,
        previousTaskDetail,
      };
    },
    onSuccess: ({ data }) => {
      toast.success("タスクを更新しました。");
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.$id] });
    },
    onError: (_error, variables, context) => {
      // Restore the exact cache state from before the optimistic update.
      context?.previousTaskLists.forEach(([queryKey, previous]) => {
        queryClient.setQueryData(queryKey, previous);
      });

      if (context?.previousTaskDetail) {
        queryClient.setQueryData(
          ["task", variables.param.taskId],
          context.previousTaskDetail
        );
      }

      toast.error("タスクの更新に失敗しました。変更を元に戻しました。");
    },
    onSettled: (_data, _error, variables) => {
      // Revalidate in the background so the optimistic cache always converges
      // to Appwrite's authoritative value.
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["task", variables.param.taskId],
      });
    },
  });

  return mutation;
};