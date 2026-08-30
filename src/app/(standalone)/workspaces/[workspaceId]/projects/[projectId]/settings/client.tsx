"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

export const ProjectIdSettingsClient = () => {
  const projectId = useProjectId();
  const { data: initialValues, isLoading } = useGetProject({ projectId });
  const { canManageStores, isLoading: isLoadingPermissions } =
    useWorkspacePermissions();

  if (isLoading || isLoadingPermissions) {
    return <PageLoader />;
  }

  if (!canManageStores) {
    return <PageError message="店舗設定は管理者のみ変更できます。" />;
  }

  if (!initialValues) {
    return <PageError message="店舗が見つかりません。" />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={initialValues} />
    </div>
  );
};
