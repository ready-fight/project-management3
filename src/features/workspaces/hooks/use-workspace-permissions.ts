"use client";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberRole } from "@/features/members/types";

import { useWorkspaceId } from "./use-workspace-id";

export const useWorkspacePermissions = () => {
  const workspaceId = useWorkspaceId();
  const { data: user, isLoading: isLoadingUser } = useCurrent();
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  const currentMember = members?.documents.find(
    (member) => member.userId === user?.$id
  );
  const isAdmin = currentMember?.role === MemberRole.ADMIN;

  return {
    currentMember,
    role: currentMember?.role,
    isAdmin,
    isMember: currentMember?.role === MemberRole.MEMBER,
    isLoading: isLoadingUser || isLoadingMembers,
    canManageWorkspace: isAdmin,
    canManageMembers: isAdmin,
    canManageStores: isAdmin,
    canCreateWorkspace: isAdmin,
  };
};
