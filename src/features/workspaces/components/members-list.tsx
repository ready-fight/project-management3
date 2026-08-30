"use client";

import { Fragment } from "react";
import { ArrowLeft, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useDeleteMember } from "@/features/members/api/use-delete-member";
import { useUpdateMember } from "@/features/members/api/use-update-member";
import { MemberRole } from "@/features/members/types";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useWorkspacePermissions } from "@/features/workspaces/hooks/use-workspace-permissions";

export const MembersList = () => {
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm(
    "メンバーを削除しますか？",
    "このメンバーをワークスペースから削除します。",
    "destructive"
  );

  const { data } = useGetMembers({ workspaceId });
  const { currentMember, isAdmin } = useWorkspacePermissions();
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

  const handleUpdateMember = (memberId: string, role: MemberRole) => {
    updateMember({ json: { role }, param: { memberId } });
  };

  const handleDeleteMember = async (memberId: string, isSelf: boolean) => {
    const ok = await confirm();
    if (!ok) return;

    deleteMember(
      { param: { memberId } },
      {
        onSuccess: () => {
          if (isSelf) {
            window.location.href = "/";
            return;
          }

          window.location.reload();
        },
      }
    );
  };

  return (
    <Card className="size-full border-none shadow-none">
      <ConfirmDialog />
      <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/workspaces/${workspaceId}`}>
            <ArrowLeft className="mr-2 size-4" />
            戻る
          </Link>
        </Button>
        <CardTitle className="text-xl font-bold">メンバー一覧</CardTitle>
      </CardHeader>
      <div className="px-7"><DottedSeparator /></div>
      <CardContent className="p-7">
        {data?.documents.map((member, index) => {
          const isSelf = currentMember?.$id === member.$id;
          const canChangeRole = isAdmin;
          const canRemoveMember = isAdmin || isSelf;
          const showActions = canChangeRole || canRemoveMember;

          return (
            <Fragment key={member.$id}>
              <div className="flex items-center gap-2">
                <MemberAvatar
                  className="size-10"
                  fallbackClassName="text-lg"
                  name={member.name}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{member.name}</p>
                    {isSelf && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        自分
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <span className="ml-auto rounded-full border bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {member.role === MemberRole.ADMIN ? "ADMIN" : "MEMBER"}
                </span>

                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon">
                        <MoreVerticalIcon className="size-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      {canChangeRole && member.role !== MemberRole.ADMIN && (
                        <DropdownMenuItem
                          className="font-medium"
                          onClick={() =>
                            handleUpdateMember(member.$id, MemberRole.ADMIN)
                          }
                          disabled={isUpdatingMember}
                        >
                          管理者に変更
                        </DropdownMenuItem>
                      )}
                      {canChangeRole && member.role !== MemberRole.MEMBER && (
                        <DropdownMenuItem
                          className="font-medium"
                          onClick={() =>
                            handleUpdateMember(member.$id, MemberRole.MEMBER)
                          }
                          disabled={isUpdatingMember}
                        >
                          メンバーに変更
                        </DropdownMenuItem>
                      )}
                      {canRemoveMember && (
                        <DropdownMenuItem
                          className="font-medium text-red-600"
                          onClick={() => handleDeleteMember(member.$id, isSelf)}
                          disabled={isDeletingMember}
                        >
                          {isSelf ? "ワークスペースから退出" : `${member.name} を削除`}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {index < data.documents.length - 1 && (
                <Separator className="my-2.5" />
              )}
            </Fragment>
          );
        })}
      </CardContent>
    </Card>
  );
};
