"use client";

import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { EditWorkspaceForm } from "@/features/workspaces/components/edit-workspace-form";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

export const WorkspaceIdSettingsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId });
  const { canManageWorkspace, isLoading: isLoadingPermissions } =
    useWorkspacePermissions();

  if (isLoading || isLoadingPermissions) {
    return <PageLoader />;
  }

  if (!canManageWorkspace) {
    return <PageError message="この設定は管理者のみ変更できます。" />;
  }

  if (!initialValues) {
    return <PageError message="ワークスペースが見つかりません。" />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <EditWorkspaceForm initialValues={initialValues} />
    </div>
  );
};
