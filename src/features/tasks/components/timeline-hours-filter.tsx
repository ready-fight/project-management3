"use client";

import { useEffect, useState } from "react";
import { Clock3Icon } from "lucide-react";
import { toast } from "sonner";

import { useUpdateMemberTimelineHours } from "@/features/members/api/use-update-member-timeline-hours";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

interface TimelineHoursFilterProps {
  workspaceId: string;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const TimelineHoursFilter = ({
  workspaceId,
}: TimelineHoursFilterProps) => {
  const { currentMember, isLoading } = useWorkspacePermissions();
  const { mutate: saveHours, isPending } = useUpdateMemberTimelineHours();

  const savedStartTime = currentMember?.timelineStartTime ?? DEFAULT_START_TIME;
  const savedEndTime = currentMember?.timelineEndTime ?? DEFAULT_END_TIME;

  const [startTime, setStartTime] = useState(savedStartTime);
  const [endTime, setEndTime] = useState(savedEndTime);

  useEffect(() => {
    setStartTime(savedStartTime);
    setEndTime(savedEndTime);
  }, [savedEndTime, savedStartTime]);

  const save = () => {
    if (!currentMember) return;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes < 9 * 60 || endMinutes > 18 * 60) {
      toast.error("表示時間は09:00〜18:00の範囲で設定してください。");
      setStartTime(savedStartTime);
      setEndTime(savedEndTime);
      return;
    }

    if (startMinutes >= endMinutes) {
      toast.error("開始時間は終了時間より前に設定してください。");
      setStartTime(savedStartTime);
      setEndTime(savedEndTime);
      return;
    }

    if (startTime === savedStartTime && endTime === savedEndTime) {
      return;
    }

    saveHours({
      memberId: currentMember.$id,
      workspaceId,
      startTime,
      endTime,
    });
  };

  return (
    <div
      className="flex h-9 w-full items-center gap-1.5 rounded-md border bg-white px-2.5 text-sm shadow-none lg:w-auto"
      title="時系列ビューの表示時間"
    >
      <Clock3Icon className="size-4 shrink-0 text-slate-400" />
      <span className="hidden whitespace-nowrap text-xs text-slate-500 xl:inline">
        表示時間
      </span>
      <input
        type="time"
        min="09:00"
        max="18:00"
        step={300}
        value={startTime}
        disabled={isLoading || isPending || !currentMember}
        aria-label="時系列表示開始時間"
        className="h-7 w-[76px] rounded border-0 bg-transparent px-1 text-xs font-medium text-slate-700 outline-none focus:bg-slate-50 disabled:opacity-60"
        onChange={(event) => setStartTime(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <span className="text-xs text-slate-400">〜</span>
      <input
        type="time"
        min="09:00"
        max="18:00"
        step={300}
        value={endTime}
        disabled={isLoading || isPending || !currentMember}
        aria-label="時系列表示終了時間"
        className="h-7 w-[76px] rounded border-0 bg-transparent px-1 text-xs font-medium text-slate-700 outline-none focus:bg-slate-50 disabled:opacity-60"
        onChange={(event) => setEndTime(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </div>
  );
};
