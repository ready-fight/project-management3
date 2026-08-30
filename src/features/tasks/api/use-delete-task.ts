import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

import type { Task } from "../types";
import {
  removeTaskFromLists,
  restoreTaskLists,
  snapshotTaskLists,
  type TaskListSnapshot,
} from "./task-cache";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)[":taskId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)[":taskId"]["$delete"]
>;

type MutationContext = {
  taskLists: TaskListSnapshot;
  taskDetail?: Task;
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, MutationContext>({
    mutationFn: async ({ param }) => {
      const response = await client.api.tasks[":taskId"].$delete({ param });

      if (!response.ok) {
        throw new Error("Failed to delete task.");
      }

      return await response.json();
    },
    onMutate: async ({ param }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const taskLists = snapshotTaskLists(queryClient);
      const taskDetail = queryClient.getQueryData<Task>([
        "task",
        param.taskId,
      ]);

      removeTaskFromLists(queryClient, param.taskId);
      queryClient.removeQueries({ queryKey: ["task", param.taskId] });

      return { taskLists, taskDetail };
    },
    onError: (_error, variables, context) => {
      if (context) {
        restoreTaskLists(queryClient, context.taskLists);
        if (context.taskDetail) {
          queryClient.setQueryData(
            ["task", variables.param.taskId],
            context.taskDetail
          );
        }
      }
      toast.error("Failed to delete task.");
    },
    onSuccess: () => {
      toast.success("タスクを削除しました。");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.removeQueries({ queryKey: ["task", variables.param.taskId] });
    },
  });

  return mutation;
};
