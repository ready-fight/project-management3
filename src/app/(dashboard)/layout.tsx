import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { EditTaskModal } from "@/features/tasks/components/edit-task-modal";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <CreateWorkspaceModal />
      <CreateProjectModal />
      <CreateTaskModal />
      <EditTaskModal />
      <div className="flex min-h-screen w-full">
        <div className="fixed left-0 top-0 hidden h-full w-[248px] overflow-y-auto lg:block">
          <Sidebar />
        </div>
        <div className="w-full lg:pl-[248px]">
          <Navbar />
          <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1600px] flex-col px-2 py-5 lg:px-7 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
