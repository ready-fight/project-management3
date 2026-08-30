"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Query } from "appwrite";

import { DATABASE_ID, TASKS_ID } from "@/config";
import {
  appwriteBrowserAccount,
  appwriteBrowserClient,
} from "@/lib/appwrite-browser";

import type { TaskDocument } from "../types";

export type TaskSyncStatus = "checking" | "realtime" | "fallback";

interface UseTaskRealtimeProps {
  workspaceId: string;
  enabled?: boolean;
}

type RealtimePayload = Partial<TaskDocument> & {
  $id?: string;
};

/**
 * Subscribes only while the task screen is mounted.
 * A browser Appwrite session is required because Realtime respects document permissions.
 */
export const useTaskRealtime = ({
  workspaceId,
  enabled = true,
}: UseTaskRealtimeProps) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskSyncStatus>("checking");

  useEffect(() => {
    if (!enabled || !workspaceId) {
      setStatus("fallback");
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let invalidateTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      if (invalidateTimer) clearTimeout(invalidateTimer);

      // A short debounce prevents bulk operations from causing one HTTP refetch per event.
      invalidateTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
        queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      }, 200);
    };

    const connect = async () => {
      try {
        // This verifies that the browser-side session exists before subscribing.
        await appwriteBrowserAccount.get();
        if (disposed) return;

        const channel = `databases.${DATABASE_ID}.collections.${TASKS_ID}.documents`;

        unsubscribe = appwriteBrowserClient.subscribe<RealtimePayload>(
          channel,
          (response) => {
            const payload = response.payload;

            // The subscription is filtered by workspace on Appwrite's server.
            // Keep this guard as a defensive check for older Realtime behavior.
            if (payload?.workspaceId && payload.workspaceId !== workspaceId) {
              return;
            }

            scheduleRefresh();
          },
          [Query.equal("workspaceId", [workspaceId])]
        );

        if (!disposed) setStatus("realtime");
      } catch (error) {
        console.warn(
          "Appwrite Realtime unavailable; using fallback refresh.",
          error
        );
        if (!disposed) setStatus("fallback");
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      unsubscribe?.();
    };
  }, [enabled, queryClient, workspaceId]);

  return { status };
};
