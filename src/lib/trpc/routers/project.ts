import { z } from "zod";
import { randomBytes } from "crypto";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
  publicProcedure,
} from "@/lib/trpc/trpc";
import {
  project,
  projectCategory,
  projectImages,
  projectDiscussions,
} from "@/lib/db/schemas";
import { listInputSchema } from "@/lib/trpc/list-schema";
import { uploadFile, getFileRecord, deleteFile } from "@/lib/minios3/utils";
import { sendDiscussionVerification } from "@/lib/email/send-discussion-verification";

const ALLOWED_SORT_COLUMNS = ["name", "slug", "userId", "isPublished", "order", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "slug", "userId", "categoryId", "isPublished"] as const;

export const projectRouter = createTRPCRouter({
  list: createPermissionProcedure("PROJECT", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as (typeof ALLOWED_FILTER_COLUMNS)[number]) && value.trim()) {
            if (key === "name") conditions.push(ilike(project.name, `%${value}%`));
            else if (key === "slug") conditions.push(ilike(project.slug, `%${value}%`));
            else if (key === "userId") conditions.push(eq(project.userId, value));
            else if (key === "categoryId") conditions.push(eq(project.categoryId, value));
            else if (key === "isPublished") conditions.push(eq(project.isPublished, value === "true"));
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const totalResult = await ctx.db.select({ count: count() }).from(project).where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as (typeof ALLOWED_SORT_COLUMNS)[number])) {
        if (sortBy === "name") orderByClause = sortOrder === "desc" ? desc(project.name) : asc(project.name);
        else if (sortBy === "slug") orderByClause = sortOrder === "desc" ? desc(project.slug) : asc(project.slug);
        else if (sortBy === "userId") orderByClause = sortOrder === "desc" ? desc(project.userId) : asc(project.userId);
        else if (sortBy === "isPublished") orderByClause = sortOrder === "desc" ? desc(project.isPublished) : asc(project.isPublished);
        else if (sortBy === "order") orderByClause = sortOrder === "desc" ? desc(project.order) : asc(project.order);
        else if (sortBy === "createdAt") orderByClause = sortOrder === "desc" ? desc(project.createdAt) : asc(project.createdAt);
      }
      orderByClause ??= desc(project.order);

      const items = await ctx.db
        .select({
          id: project.id,
          name: project.name,
          slug: project.slug,
          shortDescription: project.shortDescription,
          userId: project.userId,
          imageId: project.imageId,
          content: project.content,
          isPublished: project.isPublished,
          categoryId: project.categoryId,
          order: project.order,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          categoryName: projectCategory.name,
        })
        .from(project)
        .leftJoin(projectCategory, eq(project.categoryId, projectCategory.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return {
        items: items.map((row) => ({
          ...row,
          categoryName: row.categoryName ?? null,
        })),
        total,
        totalPages,
      };
    }),

  listPublic: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select({
        id: project.id,
        name: project.name,
        slug: project.slug,
        shortDescription: project.shortDescription,
        imageId: project.imageId,
        order: project.order,
        createdAt: project.createdAt,
      })
      .from(project)
      .where(eq(project.isPublished, true))
      .orderBy(asc(project.order), desc(project.createdAt));
    return items;
  }),

  getById: createPermissionProcedure("PROJECT", "READ")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(project).where(eq(project.id, input.id)).limit(1);
      const p = rows[0] ?? null;
      if (!p) return null;

      const [category] = await ctx.db
        .select({ id: projectCategory.id, name: projectCategory.name })
        .from(projectCategory)
        .where(eq(projectCategory.id, p.categoryId))
        .limit(1);

      const images = await ctx.db
        .select({
          id: projectImages.id,
          imageId: projectImages.imageId,
        })
        .from(projectImages)
        .where(eq(projectImages.projectId, input.id))
        .orderBy(asc(projectImages.createdAt));

      return {
        ...p,
        categoryName: category?.name,
        projectImages: images,
      };
    }),

  getBySlugPublic: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(project)
        .where(and(eq(project.slug, input.slug), eq(project.isPublished, true)))
        .limit(1);
      const p = rows[0] ?? null;
      if (!p) return null;

      const [category] = await ctx.db
        .select({ id: projectCategory.id, name: projectCategory.name })
        .from(projectCategory)
        .where(eq(projectCategory.id, p.categoryId))
        .limit(1);

      const images = await ctx.db
        .select({
          id: projectImages.id,
          imageId: projectImages.imageId,
        })
        .from(projectImages)
        .where(eq(projectImages.projectId, p.id))
        .orderBy(asc(projectImages.createdAt));

      const discussions = await ctx.db
        .select({
          id: projectDiscussions.id,
          username: projectDiscussions.username,
          message: projectDiscussions.message,
          createdAt: projectDiscussions.createdAt,
        })
        .from(projectDiscussions)
        .where(and(eq(projectDiscussions.projectId, p.id), eq(projectDiscussions.emailVerified, true), eq(projectDiscussions.isActive, true)))
        .orderBy(asc(projectDiscussions.createdAt));

      return {
        ...p,
        categoryName: category?.name,
        projectImages: images,
        discussions,
      };
    }),

  create: createPermissionProcedure("PROJECT", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        shortDescription: z.string().optional(),
        imageId: z.string().uuid().optional(),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
        content: z.string().min(1),
        categoryId: z.string().uuid(),
        isPublished: z.boolean().optional(),
        order: z.number().int().optional(),
        userId: z.string().optional(),
        projectImageIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session!.user.id;
      let imageId: string;
      if (input.imageBase64 && input.imageMimeType) {
        const base64 = input.imageBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const ext = input.imageMimeType.includes("png")
          ? ".png"
          : input.imageMimeType.includes("webp")
            ? ".webp"
            : ".jpg";
        const uploadResult = await uploadFile(buffer, `project${ext}`, input.imageMimeType, {
          prefix: "projects",
          uploadedBy: ctx.session!.user.id,
          isPublic: true,
        });
        imageId = uploadResult.fileId;
      } else if (input.imageId) {
        imageId = input.imageId;
      } else {
        throw new Error("imageId veya imageBase64 + imageMimeType gerekli");
      }
      const [row] = await ctx.db
        .insert(project)
        .values({
          name: input.name,
          slug: input.slug,
          shortDescription: input.shortDescription ?? null,
          userId,
          imageId,
          content: input.content,
          categoryId: input.categoryId,
          isPublished: input.isPublished ?? false,
          order: input.order ?? 0,
        })
        .returning({ id: project.id });
      if (!row) throw new Error("Failed to create project");

      if (input.projectImageIds?.length) {
        for (const galImgId of input.projectImageIds) {
          await ctx.db.insert(projectImages).values({
            projectId: row.id,
            imageId: galImgId,
          });
        }
      }
      return { id: row.id };
    }),

  update: createPermissionProcedure("PROJECT", "UPDATE")
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        shortDescription: z.string().optional().nullable(),
        imageId: z.string().uuid().optional(),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
        content: z.string().min(1).optional(),
        categoryId: z.string().uuid().optional(),
        isPublished: z.boolean().optional(),
        order: z.number().int().optional(),
        projectImageIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, projectImageIds, imageBase64, imageMimeType, ...rest } = input;
      const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (rest.shortDescription === null) updateData.shortDescription = null;
      if (imageBase64 && imageMimeType) {
        const [existing] = await ctx.db
          .select({ imageId: project.imageId })
          .from(project)
          .where(eq(project.id, id))
          .limit(1);
        if (existing?.imageId) {
          try {
            const rec = await getFileRecord(existing.imageId);
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
        const uploadResult = await uploadFile(buffer, `project${ext}`, imageMimeType, {
          prefix: "projects",
          uploadedBy: ctx.session!.user.id,
          isPublic: true,
        });
        updateData.imageId = uploadResult.fileId;
      } else if (rest.imageId !== undefined) {
        updateData.imageId = rest.imageId;
      }
      await ctx.db.update(project).set(updateData as Record<string, never>).where(eq(project.id, id));

      if (projectImageIds !== undefined) {
        await ctx.db.delete(projectImages).where(eq(projectImages.projectId, id));
        for (const imageId of projectImageIds) {
          await ctx.db.insert(projectImages).values({ projectId: id, imageId });
        }
      }
      return { id };
    }),

  delete: createPermissionProcedure("PROJECT", "DELETE")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(project).where(eq(project.id, input.id));
      return { id: input.id };
    }),

  discussion: createTRPCRouter({
    create: publicProcedure
      .input(
        z.object({
          projectId: z.string().uuid(),
          userEmail: z.string().email(),
          username: z.string().min(1),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const [row] = await ctx.db
          .insert(projectDiscussions)
          .values({
            projectId: input.projectId,
            userEmail: input.userEmail,
            username: input.username,
            message: input.message,
            emailVerified: false,
            isActive: false,
            verificationToken: token,
            verificationTokenExpiresAt: expiresAt,
          })
          .returning({ id: projectDiscussions.id });

        if (!row) throw new Error("Failed to create discussion");

        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          "http://localhost:3000";
        const verifyUrl = `${baseUrl}/api/discussion/verify?token=${token}`;

        await sendDiscussionVerification({
          to: input.userEmail,
          username: input.username,
          verifyUrl,
        });

        return { id: row.id };
      }),

    listPending: createPermissionProcedure("PROJECT", "READ")
      .input(z.object({ projectId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.db
          .select()
          .from(projectDiscussions)
          .where(
            and(
              eq(projectDiscussions.projectId, input.projectId),
              eq(projectDiscussions.emailVerified, true),
              eq(projectDiscussions.isActive, false)
            )
          )
          .orderBy(asc(projectDiscussions.createdAt));
      }),

    approve: createPermissionProcedure("PROJECT", "UPDATE")
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .update(projectDiscussions)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(projectDiscussions.id, input.id));
        return { id: input.id };
      }),

    delete: createPermissionProcedure("PROJECT", "UPDATE")
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.delete(projectDiscussions).where(eq(projectDiscussions.id, input.id));
        return { id: input.id };
      }),
  }),
});
