import { TaskStatus, TaskType } from "./types";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "未着手",
  [TaskStatus.TODO]: "対応予定",
  [TaskStatus.IN_PROGRESS]: "進行中",
  [TaskStatus.IN_REVIEW]: "確認中",
  [TaskStatus.DONE]: "完了",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.DELIVERY]: "搬入",
  [TaskType.PAYMENT]: "振込",
  [TaskType.DAY_OFF]: "休み",
  [TaskType.CLEANING]: "清掃",
  [TaskType.CUSTOMER]: "接客",
  [TaskType.OTHER]: "その他",
};

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  [TaskType.DELIVERY]: "🚚",
  [TaskType.PAYMENT]: "💴",
  [TaskType.DAY_OFF]: "🏖️",
  [TaskType.CLEANING]: "🧹",
  [TaskType.CUSTOMER]: "👥",
  [TaskType.OTHER]: "📋",
};
