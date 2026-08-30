import type { Models } from "node-appwrite";

import type { Member } from "@/features/members/types";
import type { Project } from "@/features/projects/types";

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskType {
  DELIVERY = "DELIVERY",
  PAYMENT = "PAYMENT",
  DAY_OFF = "DAY_OFF",
  CLEANING = "CLEANING",
  CUSTOMER = "CUSTOMER",
  OTHER = "OTHER",
}

/** Raw task shape stored in Appwrite. */
export type TaskDocument = Models.Document & {
  name: string;
  status: TaskStatus;
  workspaceId: string;
  assigneeId: string;
  projectId: string;
  position: number;
  dueDate: string;
  startTime?: string;
  endTime?: string;
  taskType?: TaskType;
  isImportant?: boolean;
  description?: string;
};

/** Assignee returned to the UI after resolving the Appwrite member's user. */
export type TaskAssignee = Member & {
  name: string;
  email: string;
};

/** Fully populated task shape returned by the task GET endpoints. */
export type Task = TaskDocument & {
  project: Project;
  assignee: TaskAssignee;
};
