import { Models } from "node-appwrite";

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

export type Task = Models.Document & {
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
  project: {
    $id: string;
    name: string;
    imageUrl?: string;
  };
  assignee: {
    $id: string;
    name: string;
    email?: string;
  };
};
