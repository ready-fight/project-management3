import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

import type { Task } from "../types";
import {
  patchTaskInLists,
  restoreTaskLists,
  snapshotTaskLists,
  type TaskListSnapshot,
} from "./task-cache";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["$patch"]
>;

type MutationContext = {
  taskLists: TaskListSnapshot;
  taskDetail?: Task;
};

const toOptimisticPatch = (json: RequestType["json"]): Partial<Task> => {
  const patch: Record<string, unknown> = { ...json };

  if (json.dueDate) {
    patch.dueDate =
      json.dueDate instanceof Date
        ? json.dueDate.toISOString()
        : new Date(String(json.dueDate)).toISOString();
  }

  return patch as Partial<Task>;
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, MutationContext>({
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
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["task", param.taskId] });

      const taskLists = snapshotTaskLists(queryClient);
      const taskDetail = queryClient.getQueryData<Task>([
        "task",
        param.taskId,
      ]);
      const patch = toOptimisticPatch(json);

      patchTaskInLists(queryClient, param.taskId, patch);
      queryClient.setQueryData<Task>(["task", param.taskId], (current) =>
        current ? { ...current, ...patch } : current
      );

      return { taskLists, taskDetail };
    },
    onError: (_error, variables, context) => {
      if (context) {
        restoreTaskLists(queryClient, context.taskLists);
        queryClient.setQueryData(
          ["task", variables.param.taskId],
          context.taskDetail
        );
      }
      toast.error("Failed to update task.");
    },
    onSuccess: () => {
      toast.success("タスクを更新しました。");
    },
    onSettled: (_data, _error, variables) => {
      // Refetch once after the write so populated store/assignee relations stay exact.
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["task", variables.param.taskId],
      });
    },
  });

  return mutation;
};
