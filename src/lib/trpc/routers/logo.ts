import { z } from "zod";
import { eq, ne, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
  publicProcedure,
} from "@/lib/trpc/trpc";
import { logo } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";
import { uploadFile, deleteFile, getFileRecord } from "@/lib/minios3/utils";

const logoStatusSchema = z.enum(["ACTIVE", "PASSIVE"]);
const logoTypeSchema = z.enum(["WEBSITE_LOGO", "WEBSITE_FAVICON", "EMAIL_LOGO", "EMAIL_FAVICON"]);
const ALLOWED_SORT_COLUMNS = ["name", "status", "type", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "status", "type"] as const;

const activeLogoItem = (r: { id: string; name: string; fileId: string | null; type: string }) =>
  r.fileId ? { id: r.id, name: r.name, fileId: r.fileId, imageUrl: `/api/files/${r.fileId}/view` } : null;

export const logoRouter = createTRPCRouter({
  getActivePublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: logo.id, name: logo.name, fileId: logo.fileId, type: logo.type })
      .from(logo)
      .where(and(eq(logo.status, "ACTIVE"), eq(logo.type, "WEBSITE_LOGO")))
      .limit(1);
    const row = rows[0];
    return row ? activeLogoItem(row) : null;
  }),

  getActivesPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: logo.id, name: logo.name, fileId: logo.fileId, type: logo.type })
      .from(logo)
      .where(eq(logo.status, "ACTIVE"));
    const acc: Record<string, { id: string; name: string; fileId: string; imageUrl: string }> = {};
    for (const r of rows) {
      const item = activeLogoItem(r);
      if (item) acc[r.type] = item;
    }
    return acc;
  }),

  list: createPermissionProcedure("LOGO", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof logo.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as (typeof ALLOWED_FILTER_COLUMNS)[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(logo.name, `%${value}%`));
            } else if (key === "status") {
              conditions.push(eq(logo.status, value as "ACTIVE" | "PASSIVE"));
            } else if (key === "type") {
              conditions.push(eq(logo.type, value as "WEBSITE_LOGO" | "WEBSITE_FAVICON" | "EMAIL_LOGO" | "EMAIL_FAVICON"));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const totalResult = await ctx.db
        .select({ count: count() })
        .from(logo)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as (typeof ALLOWED_SORT_COLUMNS)[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(logo.name) : asc(logo.name);
        } else if (sortBy === "status") {
          orderByClause = sortOrder === "desc" ? desc(logo.status) : asc(logo.status);
        } else if (sortBy === "type") {
          orderByClause = sortOrder === "desc" ? desc(logo.type) : asc(logo.type);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(logo.createdAt) : asc(logo.createdAt);
        }
      }
      orderByClause ??= desc(logo.createdAt);

      const items = await ctx.db
        .select()
        .from(logo)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return { items, total, totalPages };
    }),

  getById: createPermissionProcedure("LOGO", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(logo)
        .where(eq(logo.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  getActive: createPermissionProcedure("LOGO", "READ").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(logo)
      .where(eq(logo.status, "ACTIVE"))
      .limit(1);
    return rows[0] ?? null;
  }),

  create: createPermissionProcedure("LOGO", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        type: logoTypeSchema,
        imageBase64: z.string().min(1),
        imageMimeType: z.string().min(1),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const base64 = input.imageBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const ext = input.imageMimeType.includes("png")
        ? ".png"
        : input.imageMimeType.includes("webp")
          ? ".webp"
          : ".jpg";
      const uploadResult = await uploadFile(buffer, `logo${ext}`, input.imageMimeType, {
        prefix: "logos",
        uploadedBy: ctx.session!.user.id,
        isPublic: true,
      });
      const status = input.status ?? "PASSIVE";
      if (status === "ACTIVE") {
        await ctx.db
          .update(logo)
          .set({ status: "PASSIVE", updatedAt: new Date() })
          .where(eq(logo.type, input.type));
      }
      const [row] = await ctx.db
        .insert(logo)
        .values({
          name: input.name,
          type: input.type,
          fileId: uploadResult.fileId,
          status,
        })
        .returning({ id: logo.id });
      return { id: row!.id };
    }),

  update: createPermissionProcedure("LOGO", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        type: logoTypeSchema.optional(),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
        status: logoStatusSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, imageBase64, imageMimeType, status, type, ...rest } = input;
      let fileId: string | undefined;
      if (status === "ACTIVE") {
        const [current] = await ctx.db.select({ type: logo.type }).from(logo).where(eq(logo.id, id)).limit(1);
        const targetType = type ?? current?.type;
        if (targetType) {
          await ctx.db
            .update(logo)
            .set({ status: "PASSIVE", updatedAt: new Date() })
            .where(and(eq(logo.type, targetType), ne(logo.id, id)));
        }
      }
      if (imageBase64 && imageMimeType) {
        const [existing] = await ctx.db
          .select({ fileId: logo.fileId })
          .from(logo)
          .where(eq(logo.id, id))
          .limit(1);
        if (existing?.fileId) {
          try {
            const rec = await getFileRecord(existing.fileId);
            if (rec) await deleteFile(rec.fileName, rec.bucket);
          } catch {
            // ignore
          }
        }
        const base64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const ext = imageMimeType.includes("png")
          ? ".png"
          : imageMimeType.includes("webp")
            ? ".webp"
            : ".jpg";
        const uploadResult = await uploadFile(buffer, `logo${ext}`, imageMimeType, {
          prefix: "logos",
          uploadedBy: ctx.session!.user.id,
          isPublic: true,
        });
        fileId = uploadResult.fileId;
      }
      await ctx.db
        .update(logo)
        .set({
          ...rest,
          ...(status !== undefined ? { status } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(fileId ? { fileId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(logo.id, id));
      return { id };
    }),

  delete: createPermissionProcedure("LOGO", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(logo).where(eq(logo.id, input.id));
      return { id: input.id };
    }),

  setActive: createPermissionProcedure("LOGO", "UPDATE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select({ type: logo.type })
        .from(logo)
        .where(eq(logo.id, input.id))
        .limit(1);
      if (!target) return { id: input.id };
      await ctx.db
        .update(logo)
        .set({ status: "PASSIVE", updatedAt: new Date() })
        .where(and(eq(logo.type, target.type), ne(logo.id, input.id)));
      await ctx.db
        .update(logo)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(logo.id, input.id));
      return { id: input.id };
    }),

  setPassive: createPermissionProcedure("LOGO", "UPDATE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(logo)
        .set({ status: "PASSIVE", updatedAt: new Date() })
        .where(eq(logo.id, input.id));
      return { id: input.id };
    }),
});
