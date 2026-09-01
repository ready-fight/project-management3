"use client";

import { ResponsiveModal } from "@/components/responsive-modal";

import { EditTaskFormWrapper } from "./edit-task-form-wrapper";

import { useEditTaskModal } from "../hooks/use-edit-task-modal";

export const EditTaskModal = () => {
  const { taskId, close } = useEditTaskModal();

  const handleOpenChange = (open: boolean) => {
    // ResponsiveModal uses a mobile Drawer below 1024px. The drawer can report
    // both open and close state changes. Only clear the edit-task query state
    // when the modal is actually being closed.
    if (!open) {
      close();
    }
  };

  return (
    <ResponsiveModal open={!!taskId} onOpenChange={handleOpenChange}>
      {taskId && <EditTaskFormWrapper id={taskId} onCancel={close} />}
    </ResponsiveModal>
  );
};
