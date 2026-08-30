import { toast } from "sonner";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

import type { Task } from "../types";
import {
  patchTaskInLists,
  restoreTaskLists,
  snapshotTaskLists,
  type TaskListSnapshot,
} from "./task-cache";

type ResponseType = InferResponseType<
  (typeof client.api.tasks)["bulk-update"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.tasks)["bulk-update"]["$post"]
>;

type MutationContext = {
  taskLists: TaskListSnapshot;
};

export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType, MutationContext>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks["bulk-update"].$post({
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update tasks.");
      }

      return await response.json();
    },
    onMutate: async ({ json }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const taskLists = snapshotTaskLists(queryClient);

      json.tasks.forEach((task) => {
        patchTaskInLists(queryClient, task.$id, {
          status: task.status,
          position: task.position,
        } as Partial<Task>);
      });

      return { taskLists };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreTaskLists(queryClient, context.taskLists);
      toast.error("Failed to update tasks.");
    },
    onSuccess: () => {
      toast.success("タスクを更新しました。");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return mutation;
};
