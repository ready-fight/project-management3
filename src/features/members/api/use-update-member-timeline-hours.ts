"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

interface UpdateMemberTimelineHoursVariables {
  memberId: string;
  workspaceId: string;
  startTime: string;
  endTime: string;
}

type MembersQueryData = {
  documents: Array<{
    $id: string;
    timelineStartTime?: string;
    timelineEndTime?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export const useUpdateMemberTimelineHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      startTime,
      endTime,
    }: UpdateMemberTimelineHoursVariables) => {
      const response = await client.api.members[":memberId"].$patch({
        param: { memberId },
        json: {
          timelineStartTime: startTime,
          timelineEndTime: endTime,
        },
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          "error" in body ? body.error : "Failed to save timeline hours."
        );
      }

      return body;
    },
    onMutate: async (variables) => {
      const queryKey = ["members", variables.workspaceId] as const;
      const previous = queryClient.getQueryData<MembersQueryData>(queryKey);

      // Write first so 時系列ビュー reacts immediately when an hour is chosen.
      // Cancelling an in-flight member refetch afterwards prevents stale data
      // from replacing this optimistic value while the PATCH is running.
      queryClient.setQueryData<MembersQueryData>(queryKey, (current) => {
        if (!current) return current;

        return {
          ...current,
          documents: current.documents.map((member) =>
            member.$id === variables.memberId
              ? {
                  ...member,
                  timelineStartTime: variables.startTime,
                  timelineEndTime: variables.endTime,
                }
              : member
          ),
        };
      });

      await queryClient.cancelQueries({ queryKey });

      return { previous, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }

      toast.error(error.message || "勤務時間の保存に失敗しました。");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.workspaceId],
      });
    },
  });
};
