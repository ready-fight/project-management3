"use client";

import { ArrowUpDown, MoreVertical } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TaskActions } from "./task-actions";
import { TaskDate } from "./task-date";
import { Task } from "../types";
import { TASK_STATUS_LABELS } from "../constants";

const SortHeader = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <Button
    variant="ghost"
    className="h-8 px-2 text-xs font-semibold text-slate-600"
    onClick={onClick}
  >
    {label}
    <ArrowUpDown className="ml-1.5 size-3.5 text-slate-400" />
  </Button>
);

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortHeader
        label="タスク名"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <p className="line-clamp-1 font-medium text-slate-800">
        {row.original.name}
      </p>
    ),
  },
  {
    accessorKey: "project",
    header: ({ column }) => (
      <SortHeader
        label="店舗"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const project = row.original.project;
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <ProjectAvatar
            className="size-6"
            name={project.name}
            image={project.imageUrl}
          />
          <p className="line-clamp-1">{project.name}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "assignee",
    header: ({ column }) => (
      <SortHeader
        label="担当者"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const assignee = row.original.assignee;
      return (
        <div className="flex items-center gap-2 text-sm font-medium">
          <MemberAvatar
            className="size-6"
            fallbackClassName="text-xs"
            name={assignee.name}
          />
          <p className="line-clamp-1">{assignee.name}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <SortHeader
        label="期限"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => <TaskDate value={row.original.dueDate} />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortHeader
        label="ステータス"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant={status}>{TASK_STATUS_LABELS[status]}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <TaskActions id={row.original.$id} projectId={row.original.projectId}>
        <Button variant="ghost" className="size-8 p-0">
          <MoreVertical className="size-4" />
          <span className="sr-only">操作</span>
        </Button>
      </TaskActions>
    ),
  },
];
