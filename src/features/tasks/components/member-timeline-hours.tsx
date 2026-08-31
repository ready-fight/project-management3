"use client";

import { useEffect, useState } from "react";
import { Clock3Icon } from "lucide-react";
import { toast } from "sonner";

import { useUpdateMemberTimelineHours } from
  "@/features/members/api/use-update-member-timeline-hours";

interface MemberTimelineHoursProps {
  memberId: string;
  workspaceId: string;
  initialStartTime?: string;
  initialEndTime?: string;
  canEdit: boolean;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const MemberTimelineHours = ({
  memberId,
  workspaceId,
  initialStartTime = DEFAULT_START_TIME,
  initialEndTime = DEFAULT_END_TIME,
  canEdit,
}: MemberTimelineHoursProps) => {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const { mutate: saveHours, isPending } = useUpdateMemberTimelineHours();

  useEffect(() => {
    setStartTime(initialStartTime || DEFAULT_START_TIME);
    setEndTime(initialEndTime || DEFAULT_END_TIME);
  }, [initialEndTime, initialStartTime]);

  const save = () => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes < 9 * 60 || endMinutes > 18 * 60) {
      toast.error("勤務時間は09:00〜18:00の範囲で設定してください。");
      setStartTime(initialStartTime || DEFAULT_START_TIME);
      setEndTime(initialEndTime || DEFAULT_END_TIME);
      return;
    }

    if (startMinutes >= endMinutes) {
      toast.error("開始時間は終了時間より前に設定してください。");
      setStartTime(initialStartTime || DEFAULT_START_TIME);
      setEndTime(initialEndTime || DEFAULT_END_TIME);
      return;
    }

    if (
      startTime === (initialStartTime || DEFAULT_START_TIME) &&
      endTime === (initialEndTime || DEFAULT_END_TIME)
    ) {
      return;
    }

    saveHours({
      memberId,
      workspaceId,
      startTime,
      endTime,
    });
  };

  if (!canEdit) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
        <Clock3Icon className="size-3" />
        {initialStartTime || DEFAULT_START_TIME}〜{initialEndTime || DEFAULT_END_TIME}
      </span>
    );
  }

  return (
    <div
      className="mt-1 flex items-center justify-center gap-1"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <input
        type="time"
        min="09:00"
        max="18:00"
        step={300}
        value={startTime}
        disabled={isPending}
        aria-label="勤務開始時間"
        className="h-7 w-[82px] rounded-md border bg-white px-1.5 text-[11px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:opacity-60"
        onChange={(event) => setStartTime(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <span className="text-[11px] text-slate-400">〜</span>
      <input
        type="time"
        min="09:00"
        max="18:00"
        step={300}
        value={endTime}
        disabled={isPending}
        aria-label="勤務終了時間"
        className="h-7 w-[82px] rounded-md border bg-white px-1.5 text-[11px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:opacity-60"
        onChange={(event) => setEndTime(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </div>
  );
};
