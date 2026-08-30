import { TaskType } from "./types";

export const normalizeTime = (value?: string, fallback = "09:00") => {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return fallback;
  return value;
};

export const timeToMinutes = (value?: string) => {
  const normalized = normalizeTime(value);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const getTaskDurationMinutes = (startTime?: string, endTime?: string) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime || "10:00");
  return end > start ? end - start : 60;
};

export const getStoreAccent = (value: string) => {
  const palette = [
    "#0891b2",
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#16a34a",
    "#ca8a04",
  ];

  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const getTaskTypeAccent = (taskType?: TaskType) => {
  switch (taskType) {
    case TaskType.DELIVERY:
      return "#0284c7";
    case TaskType.PAYMENT:
      return "#7c3aed";
    case TaskType.DAY_OFF:
      return "#64748b";
    case TaskType.CLEANING:
      return "#059669";
    case TaskType.CUSTOMER:
      return "#ea580c";
    default:
      return "#475569";
  }
};
