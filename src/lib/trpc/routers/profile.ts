import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable } from "@/lib/db/schemas";
import {
  userRoleTable,
  userRoleGroupTable,
  roleTable,
  roleGroupTable,
  roleGroupRoleTable,
} from "@/lib/db/schemas";
import { uploadFile, getFileRecord, deleteFile } from "@/lib/minios3/utils";

export const profileRouter = createTRPCRouter({
  getMyRoles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const directUserRoles = await ctx.db
      .select({
        roleName: roleTable.name,
        page: roleTable.page,
      })
      .from(userRoleTable)
      .innerJoin(roleTable, eq(userRoleTable.roleId, roleTable.id))
      .where(eq(userRoleTable.userId, userId));

    const userRoleGroups = await ctx.db
      .select({
        roleGroupId: userRoleGroupTable.roleGroupId,
        roleGroupName: roleGroupTable.name,
      })
      .from(userRoleGroupTable)
      .innerJoin(
        roleGroupTable,
        eq(userRoleGroupTable.roleGroupId, roleGroupTable.id)
      )
      .where(eq(userRoleGroupTable.userId, userId));

    const roleGroupsWithRoles: Array<{
      groupName: string;
      roles: Array<{ roleName: string; page: string }>;
    }> = [];

    for (const ug of userRoleGroups) {
      const groupRoles = await ctx.db
        .select({
          roleName: roleTable.name,
          page: roleTable.page,
        })
        .from(roleGroupRoleTable)
        .innerJoin(roleTable, eq(roleGroupRoleTable.roleId, roleTable.id))
        .where(eq(roleGroupRoleTable.roleGroupId, ug.roleGroupId));

      roleGroupsWithRoles.push({
        groupName: ug.roleGroupName,
        roles: groupRoles.map((r) => ({
          roleName: r.roleName,
          page: r.page,
        })),
      });
    }

    return {
      directRoles: directUserRoles.map((r) => ({
        roleName: r.roleName,
        page: r.page,
      })),
      roleGroups: roleGroupsWithRoles,
    };
  }),

  updateMyPhoto: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1),
        mimeType: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const [currentUser] = await ctx.db
        .select({ image: userTable.image })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);

      if (currentUser?.image) {
        try {
          const rec = await getFileRecord(currentUser.image);
          if (rec) await deleteFile(rec.fileName, rec.bucket);
        } catch {
          // ignore
        }
      }

      const base64 = input.imageBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const ext = input.mimeType.includes("png")
        ? ".png"
        : input.mimeType.includes("webp")
          ? ".webp"
          : ".jpg";
      const uploadResult = await uploadFile(
        buffer,
        `photo${ext}`,
        input.mimeType,
        {
          prefix: `profilePhoto/${userId}`,
          uploadedBy: userId,
        }
      );

      await ctx.db
        .update(userTable)
        .set({
          image: uploadResult.fileId,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));

      return { fileId: uploadResult.fileId };
    }),
});
