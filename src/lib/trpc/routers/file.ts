import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, createTRPCRouter } from "@/lib/trpc/trpc";
import { uploadFile } from "@/lib/minios3/utils";
import { can } from "@/lib/rbac/permissions";

const uploadImageProcedure = protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1),
        imageMimeType: z.string().min(1),
        prefix: z.string().optional(),
      })
    )
    .use(async ({ ctx, next }) => {
      const canCreate = await can(ctx.session.user.id, "PROJECT", "CREATE");
      const canUpdate = await can(ctx.session.user.id, "PROJECT", "UPDATE");
      if (!canCreate && !canUpdate) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permission" });
      }
      return next({ ctx });
    })
    .mutation(async ({ ctx, input }) => {
      const base64 = input.imageBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const ext = input.imageMimeType.includes("png")
        ? ".png"
        : input.imageMimeType.includes("webp")
          ? ".webp"
          : ".jpg";
      const prefix = input.prefix ?? "projects";
      const result = await uploadFile(buffer, `img${ext}`, input.imageMimeType, {
        prefix,
        uploadedBy: ctx.session.user.id,
        isPublic: true,
      });
      return { fileId: result.fileId };
    });

export const fileRouter = createTRPCRouter({
  uploadImage: uploadImageProcedure,
});
