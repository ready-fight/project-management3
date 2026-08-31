"use client";

import { useEffect, useState } from "react";
import { Clock3Icon } from "lucide-react";
import { toast } from "sonner";

import { useUpdateMemberTimelineHours } from "@/features/members/api/use-update-member-timeline-hours";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface TimelineHoursFilterProps {
  workspaceId: string;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

const HOUR_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const hour = 9 + index;
  return `${String(hour).padStart(2, "0")}:00`;
});

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

  const persist = (nextStartTime: string, nextEndTime: string) => {
    if (!currentMember) return;

    const startMinutes = timeToMinutes(nextStartTime);
    const endMinutes = timeToMinutes(nextEndTime);

    if (startMinutes >= endMinutes) {
      toast.error("開始時間は終了時間より前に設定してください。");
      return;
    }

    // Update the local trigger immediately. The mutation hook also writes the
    // same values into the members React Query cache optimistically, which
    // makes the timeline gray area react before the Appwrite request finishes.
    setStartTime(nextStartTime);
    setEndTime(nextEndTime);

    saveHours({
      memberId: currentMember.$id,
      workspaceId,
      startTime: nextStartTime,
      endTime: nextEndTime,
    });
  };

  const onStartTimeChange = (value: string) => {
    persist(value, endTime);
  };

  const onEndTimeChange = (value: string) => {
    persist(startTime, value);
  };

  const disabled = isLoading || isPending || !currentMember;

  return (
    <div
      className="flex h-9 w-full items-center gap-1.5 rounded-md border bg-white px-2.5 text-sm shadow-none lg:w-auto"
      title="時系列ビューの表示時間"
    >
      <Clock3Icon className="size-4 shrink-0 text-slate-400" />
      <span className="hidden whitespace-nowrap text-xs text-slate-500 xl:inline">
        表示時間
      </span>

      <Select
        value={startTime}
        onValueChange={onStartTimeChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-7 w-[64px] border-0 bg-transparent px-1 text-xs font-medium text-slate-700 shadow-none focus:ring-0"
          aria-label="時系列表示開始時間"
        >
          <span>{startTime}</span>
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.slice(0, -1).map((time) => (
            <SelectItem
              key={time}
              value={time}
              disabled={timeToMinutes(time) >= timeToMinutes(endTime)}
            >
              {time.slice(0, 2)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-slate-400">〜</span>

      <Select
        value={endTime}
        onValueChange={onEndTimeChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-7 w-[64px] border-0 bg-transparent px-1 text-xs font-medium text-slate-700 shadow-none focus:ring-0"
          aria-label="時系列表示終了時間"
        >
          <span>{endTime}</span>
        </SelectTrigger>
        <SelectContent>
          {HOUR_OPTIONS.slice(1).map((time) => (
            <SelectItem
              key={time}
              value={time}
              disabled={timeToMinutes(time) <= timeToMinutes(startTime)}
            >
              {time.slice(0, 2)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
