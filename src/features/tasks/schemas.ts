import { z } from "zod";

import { TaskStatus, TaskType } from "./types";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時刻を HH:mm 形式で入力してください");

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "必須項目です"),
  status: z.nativeEnum(TaskStatus, { required_error: "必須項目です" }),
  workspaceId: z.string().trim().min(1, "必須項目です"),
  projectId: z.string().trim().min(1, "必須項目です"),
  dueDate: z.coerce.date(),
  assigneeId: z.string().trim().min(1, "必須項目です"),
  startTime: timeSchema,
  endTime: timeSchema,
  taskType: z.nativeEnum(TaskType, { required_error: "必須項目です" }),
  isImportant: z.boolean(),
  description: z.string().trim().max(1000, "メモは1000文字以内で入力してください").optional(),
});
