import { z } from "zod";
import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, MEMBERS_ID } from "@/config";

import { getMember } from "../utils";
import { Member, MemberRole } from "../types";

const timelineTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const updateMemberSchema = z
  .object({
    role: z.nativeEnum(MemberRole).optional(),
    timelineStartTime: timelineTimeSchema.optional(),
    timelineEndTime: timelineTimeSchema.optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.timelineStartTime !== undefined ||
      value.timelineEndTime !== undefined,
    { message: "No member changes supplied." }
  );

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { users } = await createAdminClient();
      const databases = c.get("databases");
      const user = c.get("user");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const members = await databases.listDocuments<Member>(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("workspaceId", workspaceId), Query.limit(100)]
      );

      const populatedMembers = await Promise.all(
        members.documents.map(async (member) => {
          const user = await users.get(member.userId);

          return {
            ...member,
            name: user.name || user.email,
            email: user.email,
          };
        })
      );

      return c.json({ data: { ...members, documents: populatedMembers } });
    }
  )
  .delete("/:memberId", sessionMiddleware, async (c) => {
    const { memberId } = c.req.param();
    const user = c.get("user");
    const databases = c.get("databases");

    const memberToDelete = await databases.getDocument(
      DATABASE_ID,
      MEMBERS_ID,
      memberId
    );

    const allMembersInWorkspace = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [Query.equal("workspaceId", memberToDelete.workspaceId)]
    );

    const member = await getMember({
      databases,
      workspaceId: memberToDelete.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (member.$id !== memberToDelete.$id && member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (allMembersInWorkspace.total === 1) {
      return c.json({ error: "Cannot delete the only member." }, 400);
    }

    await databases.deleteDocument(DATABASE_ID, MEMBERS_ID, memberId);

    return c.json({ data: { $id: memberToDelete.$id } });
  })
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator("json", updateMemberSchema),
    async (c) => {
      const { memberId } = c.req.param();
      const changes = c.req.valid("json");
      const user = c.get("user");
      const databases = c.get("databases");

      const memberToUpdate = await databases.getDocument<Member>(
        DATABASE_ID,
        MEMBERS_ID,
        memberId
      );

      const currentMember = await getMember({
        databases,
        workspaceId: memberToUpdate.workspaceId,
        userId: user.$id,
      });

      if (!currentMember) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const isAdmin = currentMember.role === MemberRole.ADMIN;
      const isSelf = currentMember.$id === memberToUpdate.$id;
      const isRoleChange = changes.role !== undefined;
      const isTimelineHoursChange =
        changes.timelineStartTime !== undefined ||
        changes.timelineEndTime !== undefined;

      // Role management remains ADMIN-only.
      if (isRoleChange && !isAdmin) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Members can edit only their own timeline hours. ADMIN can edit anyone.
      if (isTimelineHoursChange && !isAdmin && !isSelf) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (isRoleChange) {
        const allMembersInWorkspace = await databases.listDocuments(
          DATABASE_ID,
          MEMBERS_ID,
          [Query.equal("workspaceId", memberToUpdate.workspaceId)]
        );

        if (allMembersInWorkspace.total === 1) {
          return c.json({ error: "Cannot downgrade the only member." }, 400);
        }
      }

      const updateData: Partial<Member> = {};

      if (changes.role !== undefined) {
        updateData.role = changes.role;
      }

      if (isTimelineHoursChange) {
        const timelineStartTime =
          changes.timelineStartTime ?? memberToUpdate.timelineStartTime ?? "09:00";
        const timelineEndTime =
          changes.timelineEndTime ?? memberToUpdate.timelineEndTime ?? "18:00";

        const startMinutes = timeToMinutes(timelineStartTime);
        const endMinutes = timeToMinutes(timelineEndTime);

        if (startMinutes < 9 * 60 || endMinutes > 18 * 60) {
          return c.json(
            { error: "Timeline hours must be between 09:00 and 18:00." },
            400
          );
        }

        if (startMinutes >= endMinutes) {
          return c.json(
            { error: "Timeline start time must be earlier than end time." },
            400
          );
        }

        updateData.timelineStartTime = timelineStartTime;
        updateData.timelineEndTime = timelineEndTime;
      }

      await databases.updateDocument(
        DATABASE_ID,
        MEMBERS_ID,
        memberId,
        updateData
      );

      return c.json({
        data: {
          $id: memberToUpdate.$id,
          ...updateData,
        },
      });
    }
  );

export default app;
