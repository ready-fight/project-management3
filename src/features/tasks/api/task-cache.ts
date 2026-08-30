import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { Task } from "../types";

export type TaskListCache = {
  total: number;
  documents: Task[];
  [key: string]: unknown;
};

export type TaskListSnapshot = Array<
  [QueryKey, TaskListCache | undefined]
>;

export const snapshotTaskLists = (
  queryClient: QueryClient
): TaskListSnapshot =>
  queryClient.getQueriesData<TaskListCache>({ queryKey: ["tasks"] });

export const restoreTaskLists = (
  queryClient: QueryClient,
  snapshots: TaskListSnapshot
) => {
  snapshots.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

export const patchTaskInLists = (
  queryClient: QueryClient,
  taskId: string,
  patch: Partial<Task>
) => {
  queryClient.setQueriesData<TaskListCache>(
    { queryKey: ["tasks"] },
    (current) => {
      if (!current) return current;

      let changed = false;
      const documents = current.documents.map((task) => {
        if (task.$id !== taskId) return task;
        changed = true;
        return { ...task, ...patch };
      });

      return changed ? { ...current, documents } : current;
    }
  );
};

export const removeTaskFromLists = (
  queryClient: QueryClient,
  taskId: string
) => {
  queryClient.setQueriesData<TaskListCache>(
    { queryKey: ["tasks"] },
    (current) => {
      if (!current) return current;

      const documents = current.documents.filter((task) => task.$id !== taskId);
      if (documents.length === current.documents.length) return current;

      return {
        ...current,
        documents,
        total: Math.max(0, current.total - 1),
      };
    }
  );
};
