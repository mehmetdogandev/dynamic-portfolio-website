import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import {
  getMyPermissionsForAccess,
  getMyPermissionsFull,
} from "@/lib/rbac/permissions";

export const permissionsRouter = createTRPCRouter({
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    return getMyPermissionsForAccess(ctx.session.user.id);
  }),
  getMyPermissionsFull: protectedProcedure.query(async ({ ctx }) => {
    return getMyPermissionsFull(ctx.session.user.id);
  }),
});
